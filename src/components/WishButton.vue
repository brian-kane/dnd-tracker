<script setup lang="ts">
const email = import.meta.env.VITE_WISH_EMAIL
const href = email ? `mailto:${email}?subject=${encodeURIComponent('Wish: ')}` : undefined
</script>

<template>
  <a v-if="href" class="wish-link" :href="href">Send a wish</a>
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
