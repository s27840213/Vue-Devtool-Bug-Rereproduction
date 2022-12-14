<template lang="pug">
div(class="list-font")
  div {{title}}
  div(class="list-font-items" v-for="item in list" :key="item.id")
    slot(:item="item")
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  emits: [],
  props: {
    title: {
      type: String,
      required: true
    },
    list: {
      type: Array,
      required: true
    }
  }
})

</script>

<style lang="scss" scoped>
.list-font {

}
</style>
