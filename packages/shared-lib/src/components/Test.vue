<template>
  <button @click="log">Click me</button>
</template>

<script setup lang="ts">
const log = () => {
  console.log('clicked')
}
</script>
