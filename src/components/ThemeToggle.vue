<script setup lang="ts">
import { ref, watchEffect } from 'vue'

type Theme = 'light' | 'dark'

const theme = ref<Theme>('light')

watchEffect(() => {
  document.documentElement.dataset.theme = theme.value
})

function toggleTheme() {
  theme.value = theme.value === 'light' ? 'dark' : 'light'
}
</script>

<template>
  <button type="button" class="theme-toggle" :aria-pressed="theme === 'dark'" @click="toggleTheme">
    Theme: {{ theme === 'dark' ? 'Dark' : 'Light' }}
  </button>
</template>

<style scoped>
.theme-toggle {
  display: inline-flex;
  align-items: center;
  min-height: var(--control-min-size);
  padding-inline: var(--space-4);
  font-family: var(--font-family);
  font-size: var(--font-size-sm);
  color: var(--color-text);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  cursor: pointer;
}

.theme-toggle:hover,
.theme-toggle:focus-visible {
  border-color: var(--color-accent);
}
</style>
