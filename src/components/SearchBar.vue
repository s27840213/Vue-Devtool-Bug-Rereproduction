<template lang="pug">
  form(class="search-bar bg-gray-6"
    @submit="onSearch")
    input(class="search-bar__input body-2"
      type="text"
      v-model="keyword"
      :placeholder="placeholder"
      :style="inputStyles()")
    svg-icon(v-if="clear && keyword"
      class="pointer mr-5"
      iconName="close"
      iconColor="gray-3"
      iconWidth="20px"
      @click.native="onClear")
    svg-icon(class="pointer"
      iconName="search"
      iconColor="gray-3"
      iconWidth="20px"
      @click.native="onSearch"
    )
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
    },
    clear: {
      type: Boolean
    },
    defaultKeyword: {
      type: String,
      default: ''
    },
    fontFamily: {
      type: String,
      default: ''
    }
  },
  data () {
    return {
      keyword: ''
    }
  },
  watch: {
    defaultKeyword (val) {
      this.keyword = val
    }
  },
  methods: {
    inputStyles() {
      return { fontFamily: this.fontFamily }
    },
    onSearch (event: Event) {
      event.preventDefault()
      this.$emit('search', this.keyword)
    },
    onClear () {
      this.keyword = ''
      this.$emit('search', '')
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
    flex: 1;
    margin-right: 10px;
    background-color: transparent;
  }
}
</style>
