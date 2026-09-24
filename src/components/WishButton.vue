<script setup lang="ts">
const email = import.meta.env.VITE_WISH_EMAIL
if (!email) {
  throw new Error('VITE_WISH_EMAIL is not set')
}
const href = `mailto:${email}?subject=${encodeURIComponent('Wish: ')}`
</script>

<template>
  <a class="wish-link" :href="href">Send a wish</a>
</template>

<style scoped>
.wish-link {
  display: inline-flex;
  align-items: center;
  min-height: var(--control-min-size);
  padding-inline: var(--space-4);
  font-family: var(--font-family);
  font-size: var(--font-size-sm);
  color: var(--color-accent);
  text-decoration: none;
}

.wish-link:hover,
.wish-link:focus-visible {
  text-decoration: underline;
}
</style>
