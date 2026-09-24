<script setup lang="ts">
const entries = __CHANGELOG__.map((entry) => ({
  ...entry,
  commitUrl: `${__REPO_URL__}/commit/${entry.sha}`,
}))
</script>

<template>
  <details class="changelog">
    <summary>Changelog</summary>
    <ol>
      <li v-for="entry in entries" :key="entry.sha">
        <span class="type">{{ entry.type }}</span>
        <a :href="entry.commitUrl" target="_blank" rel="noopener">
          {{ entry.scope }}: {{ entry.outcome }}
        </a>
        <time :datetime="entry.date">{{ entry.date }}</time>
      </li>
    </ol>
  </details>
</template>

<style scoped>
.changelog {
  padding: var(--space-2) var(--space-4);
  font-family: var(--font-family);
  font-size: var(--font-size-sm);
  line-height: var(--line-height);
  color: var(--color-text);
}

summary {
  display: flex;
  align-items: center;
  min-height: var(--control-min-size);
  cursor: pointer;
  color: var(--color-text-muted);
}

summary::before {
  content: '▸';
  margin-inline-end: var(--space-2);
}

.changelog[open] summary::before {
  content: '▾';
}

summary::-webkit-details-marker {
  display: none;
}

ol {
  list-style: none;
  margin: 0;
  padding: 0;
}

li {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: var(--space-1) var(--space-2);
  padding-block: var(--space-1);
  border-bottom: 1px solid var(--color-border);
}

.type {
  min-width: 3.5em;
  padding-inline: var(--space-1);
  border-radius: var(--radius-sm);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  font-family: monospace;
  text-align: center;
}

a {
  flex: 1 1 12em;
  color: var(--color-accent);
}

time {
  color: var(--color-text-muted);
  font-variant-numeric: tabular-nums;
}
</style>
