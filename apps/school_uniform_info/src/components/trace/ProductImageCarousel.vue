<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, shallowRef, watch } from 'vue'

const props = withDefaults(defineProps<{
  images: readonly string[]
  alt: string
  interval?: number
}>(), {
  interval: 5000,
})

const activeIndex = shallowRef(0)
const failedImages = shallowRef<Set<string>>(new Set())
const touchStartX = shallowRef<number | null>(null)
const visibleImages = computed(() =>
  [...new Set(props.images.map((image) => image.trim()).filter(Boolean))]
    .filter((image) => !failedImages.value.has(image)),
)
let timer: ReturnType<typeof setInterval> | undefined

function stopAutoPlay() {
  if (timer) clearInterval(timer)
  timer = undefined
}

function startAutoPlay() {
  stopAutoPlay()
  if (visibleImages.value.length <= 1 || document.hidden) return
  timer = setInterval(() => {
    activeIndex.value = (activeIndex.value + 1) % visibleImages.value.length
  }, props.interval)
}

function goTo(index: number) {
  activeIndex.value = index
  startAutoPlay()
}

function handleImageError(image: string) {
  failedImages.value = new Set([...failedImages.value, image])
}

function handleTouchStart(event: TouchEvent) {
  touchStartX.value = event.touches[0]?.clientX ?? null
}

function handleTouchEnd(event: TouchEvent) {
  if (touchStartX.value === null || visibleImages.value.length <= 1) return
  const distance = (event.changedTouches[0]?.clientX ?? touchStartX.value) - touchStartX.value
  touchStartX.value = null
  if (Math.abs(distance) < 36) return
  const offset = distance < 0 ? 1 : -1
  goTo((activeIndex.value + offset + visibleImages.value.length) % visibleImages.value.length)
}

function handleVisibilityChange() {
  if (document.hidden) stopAutoPlay()
  else startAutoPlay()
}

watch(visibleImages, (images) => {
  if (activeIndex.value >= images.length) activeIndex.value = 0
  startAutoPlay()
})

onMounted(() => {
  startAutoPlay()
  document.addEventListener('visibilitychange', handleVisibilityChange)
})

onBeforeUnmount(() => {
  stopAutoPlay()
  document.removeEventListener('visibilitychange', handleVisibilityChange)
})
</script>

<template>
  <figure
    class="product-carousel"
    aria-label="产品图片轮播"
    @touchstart.passive="handleTouchStart"
    @touchend.passive="handleTouchEnd"
  >
    <Transition name="carousel-fade" mode="out-in">
      <img
        v-if="visibleImages.length"
        :key="visibleImages[activeIndex]"
        :src="visibleImages[activeIndex]"
        :alt="visibleImages.length > 1 ? `${alt} ${activeIndex + 1}` : alt"
        @error="handleImageError(visibleImages[activeIndex])"
      />
      <span v-else class="product-carousel__empty">暂无产品图片</span>
    </Transition>
    <div v-if="visibleImages.length > 1" class="product-carousel__dots" aria-label="选择产品图片">
      <button
        v-for="(_, index) in visibleImages"
        :key="index"
        type="button"
        :class="{ active: activeIndex === index }"
        :aria-label="`查看第 ${index + 1} 张产品图片`"
        :aria-current="activeIndex === index ? 'true' : undefined"
        @click="goTo(index)"
      />
    </div>
  </figure>
</template>

<style scoped>
.product-carousel {
  position: relative;
  overflow: hidden;
  min-width: 0;
  align-self: center;
  margin: 0;
  border-radius: 12px;
  background: #e9f3ff;
  touch-action: pan-y;
}

.product-carousel img {
  display: block;
  width: 100%;
  min-height: 148px;
  max-height: 168px;
  aspect-ratio: 4 / 5;
  object-fit: cover;
}

.product-carousel__empty {
  display: grid;
  min-height: 148px;
  padding: 16px;
  color: #64748b;
  font-size: 12px;
  text-align: center;
  place-items: center;
}

.product-carousel__dots {
  position: absolute;
  right: 0;
  bottom: 8px;
  left: 0;
  display: flex;
  justify-content: center;
  gap: 5px;
}

.product-carousel__dots button {
  width: 7px;
  height: 7px;
  padding: 0;
  border: 1px solid rgb(255 255 255 / 80%);
  border-radius: 999px;
  background: rgb(15 23 42 / 38%);
  box-shadow: 0 1px 3px rgb(15 23 42 / 20%);
}

.product-carousel__dots button.active {
  width: 18px;
  background: #fff;
}

.carousel-fade-enter-active,
.carousel-fade-leave-active {
  transition: opacity 180ms ease;
}

.carousel-fade-enter-from,
.carousel-fade-leave-to {
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  .carousel-fade-enter-active,
  .carousel-fade-leave-active {
    transition: none;
  }
}
</style>
