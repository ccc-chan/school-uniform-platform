interface LabelIconManifestEntry {
  categoryKey: string
  filename: string
  url: string
}

declare const __LABEL_ICON_MANIFEST__: readonly LabelIconManifestEntry[]

const categoryDefinitions = [
  { key: 'electrical', label: '电子电器' },
  { key: 'office', label: '办公' },
  { key: 'plant', label: '植物' },
  { key: 'universal', label: '通用' },
  { key: 'sports', label: '运动' },
  { key: 'animal', label: '动物' },
  { key: 'festival', label: '节日' },
  { key: 'apparel', label: '服饰美妆' },
  { key: 'expression', label: '表情' },
  { key: 'kitchen', label: '厨房与食品' },
] as const

export interface LabelIcon {
  id: string
  name: string
  categoryKey: string
  categoryLabel: string
  url: string
}

export interface LabelIconCategory {
  key: string
  label: string
  icons: LabelIcon[]
}

const collator = new Intl.Collator('zh-CN', {
  numeric: true,
  sensitivity: 'base',
})

const iconsByCategory = new Map<string, LabelIcon[]>()

for (const { categoryKey, filename, url } of __LABEL_ICON_MANIFEST__) {
  const category = categoryDefinitions.find(
    (item) => item.key === categoryKey,
  )

  if (!category) continue

  const name = filename.replace(/\.png$/i, '')
  const icons = iconsByCategory.get(categoryKey) ?? []

  icons.push({
    id: `${categoryKey}/${filename}`,
    name,
    categoryKey,
    categoryLabel: category.label,
    url,
  })
  iconsByCategory.set(categoryKey, icons)
}

export const LABEL_ICON_CATEGORIES: readonly LabelIconCategory[] =
  categoryDefinitions.map((category) => ({
    ...category,
    icons: [...(iconsByCategory.get(category.key) ?? [])].sort((left, right) =>
      collator.compare(left.name, right.name),
    ),
  }))
