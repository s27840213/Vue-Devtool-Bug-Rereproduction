<template lang="pug">
div(class="list-font")
  div {{title}}
  div(class="list-font-items" v-for="item in list" :key="item.id")
    slot(:item="item")
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  props: {
    title: String,
    list: Array
  }
})

</script>

<style lang="scss" scoped>
.list-font {

}
</style>
