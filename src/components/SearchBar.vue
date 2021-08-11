<template lang="pug">
  form(class="search-bar bg-gray-6"
    @submit="onSearch")
    input(class="search-bar__input"
      type="text"
      v-model="keyword"
      :placeholder="placeholder")
    svg-icon(class="pointer" :iconName="'search'" :iconColor="'gray-3'" :iconWidth="'20px'")
</template>

<script lang="ts">
import Vue from 'vue'

export default Vue.extend({
  components: {
  },
  props: {
    placeholder: {
      type: String,
      default: 'Search from our template'
    }
  },
  data () {
    return {
      keyword: ''
    }
  },
  methods: {
    onSearch (event: Event) {
      event.preventDefault()
      this.$emit('search', this.keyword)
    }
  }
})
</script>

<style lang="scss" scoped>
.search-bar {
  @include size(100%, 40px);
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 5px 16px;
  box-sizing: border-box;
  &__input {
    width: 100%;
    margin-right: 10px;
    background-color: transparent;
  }
}
</style>
