<template lang="pug">
  div(class="list-font")
    div {{title}}
    div(class="list-font-items" v-for="item in list" :key="item.id")
      slot(:item="item")
</template>

<script lang="ts">
import Vue from 'vue'

export default Vue.extend({
  props: {
    title: String,
    list: Array
  },
  mounted() {
    console.log(this.list)
  }
})

</script>

<style lang="scss" scoped>
.list-font {

}
</style>
