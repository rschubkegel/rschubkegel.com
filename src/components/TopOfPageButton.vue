<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'

const button = ref<HTMLButtonElement | null>(null)
const visible = ref(false)
let observer: ResizeObserver | undefined

function contentExceedsViewport() {
	const el = button.value
	const footer = el?.closest('footer')
	const rule = footer?.querySelector('hr')
	if (!el || !footer || !rule) return false

	const previousButtonDisplay = el.style.display
	const previousRuleDisplay = rule.style.display
	el.style.display = 'none'
	rule.style.display = 'none'
	const bottom = footer.getBoundingClientRect().bottom + window.scrollY
	el.style.display = previousButtonDisplay
	rule.style.display = previousRuleDisplay

	return bottom > window.innerHeight + 1
}

function update() {
	const overflows = contentExceedsViewport()
	visible.value = overflows
	button.value?.closest('footer')?.classList.toggle('needs-scroll', overflows)
}

function onClick() {
	window.scrollTo({ top: 0, behavior: 'smooth' })
}

onMounted(() => {
	update()
	observer = new ResizeObserver(update)
	const content = document.getElementById('full-height-container')
	if (content) observer.observe(content)
	window.addEventListener('resize', update)
})

onUnmounted(() => {
	observer?.disconnect()
	window.removeEventListener('resize', update)
})
</script>

<template>
	<button v-show="visible" ref="button" @click="onClick">Back to top</button>
</template>
