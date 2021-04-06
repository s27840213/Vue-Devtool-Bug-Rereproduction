<template lang="pug">
  div(class="search-bar bg-gray-6")
    input(class="search-bar__input"
      type="text"
      placeholder="Search from our template")
    svg-icon(:iconName="'search'" :iconColor="'gray-3'" :iconWidth="'15px'")
</template>

<script lang="ts">
import Vue from 'vue'

export default Vue.extend({
  components: {
  }
})
</script>

<style lang="scss" scoped>
.search-bar {
  @include size(100%, 40px);
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 5px 10px;
  box-sizing: border-box;
  &__input {
    width: 100%;
    margin-right: 10px;
    background-color: transparent;
    outline: none;
    border: none;
  }
}
</style>
