import { computed, shallowRef, type Ref } from 'vue'

export interface SelectableLabelItem {
  id: string
  x: number
  y: number
}

interface Point {
  x: number
  y: number
}

interface Bounds {
  left: number
  top: number
  right: number
  bottom: number
}

interface SelectionOptions {
  artwork: Readonly<Ref<HTMLElement | null>>
  editable: () => boolean
  items: () => SelectableLabelItem[]
  update: (items: SelectableLabelItem[]) => void
}

interface Gesture {
  pointerId: number
  mode: 'box' | 'move'
  start: Point
  current: Point
  originalIds: string[]
  items: SelectableLabelItem[]
  bounds: Bounds | null
}

export function useLabelSelection(options: SelectionOptions) {
  const ids = shallowRef<string[]>([])
  const gesture = shallowRef<Gesture | null>(null)
  const selectedIds = computed(() =>
    options.items().filter((item) => ids.value.includes(item.id)).map((item) => item.id),
  )
  const count = computed(() => selectedIds.value.length)
  const isSelected = (id: string) => selectedIds.value.includes(id)

  function point(event: PointerEvent): Point {
    const rect = options.artwork.value!.getBoundingClientRect()
    return {
      x: ((event.clientX - rect.left) / rect.width) * 100,
      y: ((event.clientY - rect.top) / rect.height) * 100,
    }
  }

  function elements() {
    const root = options.artwork.value
    if (!root) return []
    const frame = root.getBoundingClientRect()
    if (!frame.width || !frame.height) return []
    return Array.from(root.querySelectorAll<HTMLElement>('[data-selection-id]')).map((element) => {
      const rect = element.getBoundingClientRect()
      return {
        id: element.dataset.selectionId!,
        left: ((rect.left - frame.left) / frame.width) * 100,
        top: ((rect.top - frame.top) / frame.height) * 100,
        right: ((rect.right - frame.left) / frame.width) * 100,
        bottom: ((rect.bottom - frame.top) / frame.height) * 100,
      }
    })
  }

  function bounds(): Bounds | null {
    const selected = elements().filter((element) => isSelected(element.id))
    if (!selected.length) return null
    return {
      left: Math.min(...selected.map((element) => element.left)),
      top: Math.min(...selected.map((element) => element.top)),
      right: Math.max(...selected.map((element) => element.right)),
      bottom: Math.max(...selected.map((element) => element.bottom)),
    }
  }

  function selectOne(id: string) {
    if (options.editable()) ids.value = [id]
  }

  function selectAll() {
    if (!options.editable()) return
    ids.value = options.items().map((item) => item.id)
    options.artwork.value?.focus({ preventScroll: true })
  }

  function clear() {
    ids.value = []
    const root = options.artwork.value
    const pointerId = gesture.value?.pointerId
    gesture.value = null
    if (pointerId !== undefined && root?.hasPointerCapture(pointerId)) {
      root.releasePointerCapture(pointerId)
    }
  }

  function translate(items: SelectableLabelItem[], x: number, y: number) {
    options.update(items.map((item) => ({ ...item, x: item.x + x, y: item.y + y })))
  }

  function align(axis: 'x' | 'y') {
    if (!options.editable()) return
    const box = bounds()
    if (!box) return
    if (axis === 'x') {
      translate(
        options.items().filter((item) => isSelected(item.id)),
        50 - (box.left + box.right) / 2,
        0,
      )
      return
    }
    const center = (box.top + box.bottom) / 2
    const rectangles = new Map(elements().map((item) => [item.id, item]))
    options.update(
      options.items().filter((item) => isSelected(item.id)).map((item) => {
        const rect = rectangles.get(item.id)
        if (!rect) return item
        return {
          ...item,
          x: item.x,
          y: item.y + center - (rect.top + rect.bottom) / 2,
        }
      }),
    )
  }

  function constrain(delta: number, start: number, end: number) {
    if (end - start > 100) return delta
    return Math.min(100 - end, Math.max(-start, delta))
  }

  function onPointerDown(event: PointerEvent) {
    if (!options.editable() || event.button !== 0 || !event.isPrimary || gesture.value) return
    const target = event.target as Element
    if (target.closest('.qr-label-artwork__resize-handle')) return
    const root = options.artwork.value
    if (!root?.clientWidth || !root.clientHeight) return
    const id = target.closest<HTMLElement>('[data-selection-id]')?.dataset.selectionId
    const additive = event.ctrlKey || event.metaKey || event.shiftKey
    const originalIds = [...selectedIds.value]
    event.preventDefault()
    event.stopPropagation()
    if (id && additive) {
      ids.value = isSelected(id)
        ? selectedIds.value.filter((selected) => selected !== id)
        : [...selectedIds.value, id]
      root.focus({ preventScroll: true })
      return
    }
    if (id && !isSelected(id)) selectOne(id)
    if (!id && !additive) ids.value = []
    root.focus({ preventScroll: true })
    gesture.value = {
      pointerId: event.pointerId,
      mode: id ? 'move' : 'box',
      start: point(event),
      current: point(event),
      originalIds: additive ? originalIds : [],
      items: options.items().filter((item) => isSelected(item.id)),
      bounds: bounds(),
    }
    root.setPointerCapture(event.pointerId)
  }

  function onPointerMove(event: PointerEvent) {
    const state = gesture.value
    if (!state || state.pointerId !== event.pointerId) return
    event.preventDefault()
    event.stopPropagation()
    const current = point(event)
    if (state.mode === 'move' && state.bounds) {
      translate(
        state.items,
        constrain(current.x - state.start.x, state.bounds.left, state.bounds.right),
        constrain(current.y - state.start.y, state.bounds.top, state.bounds.bottom),
      )
      return
    }
    current.x = Math.min(100, Math.max(0, current.x))
    current.y = Math.min(100, Math.max(0, current.y))
    gesture.value = { ...state, current }
    const box = {
      left: Math.min(state.start.x, current.x),
      right: Math.max(state.start.x, current.x),
      top: Math.min(state.start.y, current.y),
      bottom: Math.max(state.start.y, current.y),
    }
    const hits = elements().filter((element) =>
      element.right >= box.left && element.left <= box.right &&
      element.bottom >= box.top && element.top <= box.bottom,
    )
    ids.value = [...new Set([...state.originalIds, ...hits.map((element) => element.id)])]
  }

  function onPointerUp(event: PointerEvent) {
    if (gesture.value?.pointerId !== event.pointerId) return
    event.stopPropagation()
    gesture.value = null
    const root = options.artwork.value
    if (root?.hasPointerCapture(event.pointerId)) root.releasePointerCapture(event.pointerId)
  }

  function onFocus(event: FocusEvent) {
    const id = (event.target as HTMLElement).dataset.selectionId
    if (id && !isSelected(id)) selectOne(id)
  }

  function onKeydown(event: KeyboardEvent) {
    if (!options.editable()) return
    if ((event.target as Element).closest('input, textarea, select, [contenteditable="true"]')) return
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'a') {
      event.preventDefault()
      event.stopPropagation()
      selectAll()
    } else if (event.key === 'Escape') {
      event.preventDefault()
      event.stopPropagation()
      clear()
    } else if (!gesture.value && !event.ctrlKey && !event.metaKey && !event.altKey) {
      const step = event.shiftKey ? 5 : 1
      const delta = ({
        ArrowLeft: [-step, 0], ArrowRight: [step, 0],
        ArrowUp: [0, -step], ArrowDown: [0, step],
      } as Record<string, [number, number]>)[event.key]
      const box = bounds()
      if (!delta || !box) return
      event.preventDefault()
      event.stopPropagation()
      translate(
        options.items().filter((item) => isSelected(item.id)),
        constrain(delta[0], box.left, box.right),
        constrain(delta[1], box.top, box.bottom),
      )
    }
  }

  const marqueeStyle = computed(() => {
    const state = gesture.value
    if (state?.mode !== 'box') return null
    return {
      left: `${Math.min(state.start.x, state.current.x)}%`,
      top: `${Math.min(state.start.y, state.current.y)}%`,
      width: `${Math.abs(state.current.x - state.start.x)}%`,
      height: `${Math.abs(state.current.y - state.start.y)}%`,
    }
  })

  return {
    count, isSelected, selectOne, selectAll, clear, align, marqueeStyle,
    onPointerDown, onPointerMove, onPointerUp, onFocus, onKeydown,
  }
}
