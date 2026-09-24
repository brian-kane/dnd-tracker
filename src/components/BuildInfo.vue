<script setup lang="ts">
const shortSha = __BUILD_SHA__.slice(0, 7)
const commitUrl = `${__REPO_URL__}/commit/${__BUILD_SHA__}`
const builtAtIso = __BUILD_TIME__
const builtAt = new Date(builtAtIso).toLocaleString(undefined, {
  dateStyle: 'medium',
  timeStyle: 'short',
})
</script>

<template>
  <footer class="build-info">
    Build <a :href="commitUrl" target="_blank" rel="noopener">{{ shortSha }}</a> ·
    <time :datetime="builtAtIso">{{ builtAt }}</time>
  </footer>
</template>

<style scoped>
.build-info {
  padding: var(--space-2) var(--space-4);
  font-family: var(--font-family);
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
}

.build-info a {
  color: var(--color-accent);
  font-family: monospace;
}
</style>
