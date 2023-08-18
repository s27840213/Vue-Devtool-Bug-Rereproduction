<template lang="pug">
div(class="flex flex-col justify-center items-center")
  div(v-for="color in colorKeys" :key="color" class="flex flex-col items-center justify-center rounded-full p-10 border-2 border-appBg")
    span() {{color}}
    div(class="w-10 h-10" :class="`bg-${color}`")
    svg-icon(:iconName="'brush'" :iconColor="color")
    nu-svg-icon(:iconName="'brush'" :iconColor="color")
    hr
</template>

<script setup lang="ts">
import colors from '@/assets/json/colors.json'
import { storeToRefs } from 'pinia'
import { computed } from 'vue'
import { useCounterStore } from './stores/counter'
const counterStore = useCounterStore()

const { increment } = counterStore
const { count } = storeToRefs(counterStore)
const colorKeys = computed<any>(() => Object.keys(colors))
console.log(colorKeys.value)
</script>

<style scoped>
header {
  line-height: 1.5;
  max-height: 100vh;
}

.logo {
  display: block;
  margin: 0 auto 2rem;
}

nav {
  width: 100%;
  font-size: 12px;
  text-align: center;
  margin-top: 2rem;
}

nav a.router-link-exact-active {
  color: var(--color-text);
}

nav a.router-link-exact-active:hover {
  background-color: transparent;
}

nav a {
  display: inline-block;
  padding: 0 1rem;
  border-left: 1px solid var(--color-border);
}

nav a:first-of-type {
  border: 0;
}

@media (min-width: 1024px) {
  header {
    display: flex;
    place-items: center;
    padding-right: calc(var(--section-gap) / 2);
  }

  .logo {
    margin: 0 2rem 0 0;
  }

  header .wrapper {
    display: flex;
    place-items: flex-start;
    flex-wrap: wrap;
  }

  nav {
    text-align: left;
    margin-left: -1rem;
    font-size: 1rem;

    padding: 1rem 0;
    margin-top: 1rem;
  }
}
</style>
