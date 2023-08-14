<script setup lang="ts">
defineProps<{
  msg: string
}>()
</script>

<template lang="pug">
div(class="greetings")
  h1 {{  msg  }}
  h3(class="text-appBtnPrimaryBg hover:text-appSelection text-btn-md") You’ve successdsdasfully created a project with
    a(
      href="https://vitejs.dev/"
      target="_blank"
      rel="noopener") Vite +
    a(
      href="https://vuejs.org/"
      target="_blank"
      rel="noopener") Vue 3. What's next?
</template>

<style scoped>
h1 {
  font-weight: 500;
  font-size: 2.6rem;
  position: relative;
  top: -10px;
}

h3 {
  font-size: 1.2rem;
}

.greetings h1,
.greetings h3 {
  text-align: center;
}

@media (min-width: 1024px) {
  .greetings h1,
  .greetings h3 {
    text-align: left;
  }
}
</style>
