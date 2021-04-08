<template lang="pug">
  div(class="temp__content")
    img(class="temp__item"
      v-for="i in 24" :src="require('@/assets/img/svg/img-tmp.svg')")
</template>

<script lang="ts">

/**
 * This components is temporarily used for img section, and it will be remove in the future
 */
import Vue from 'vue'

export default Vue.extend({

})
</script>

<style lang="scss" scoped>
.temp {
  &__content {
    height: 100%;
    display: grid;
    grid-auto-rows: auto;
    grid-template-columns: repeat(2, 1fr);
    row-gap: 20px;
    column-gap: 20px;
    padding-top: 20px;
    box-sizing: border-box;
    overflow-y: scroll;
    &::-webkit-scrollbar {
      display: none;
    }
  }
  &__item {
    width: 100%;
  }
}
</style>
