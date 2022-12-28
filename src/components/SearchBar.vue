<template lang="pug">
  //- Show search button on mobile, https://www.paddingleft.com/2019/09/18/Show-Search-on-mobile-devices-keyboard
  form(class="search-bar bg-gray-6" action @submit="onSearch")
    svg-icon(class="pointer"
      iconName="search"
      :iconColor="color.search || 'gray-3'"
      iconWidth="20px")
    input(class="search-bar__input body-2"
      type="search"
      v-model="keyword"
      @input="onUpdate"
      :placeholder="placeholder"
      :style="inputStyles()")
    svg-icon(v-if="clear && keyword"
      class="pointer mr-5"
      iconName="close"
      :iconColor="color.close || 'gray-3'"
      iconWidth="20px"
      @click.native="onClear")
    slot
</template>

<script lang="ts">
import i18n from '@/i18n'
import Vue from 'vue'

export default Vue.extend({
  components: {
  },
  props: {
    placeholder: {
      type: String,
      default: `${i18n.t('NN0092')}`
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
    },
    color: {
      type: Object,
      default: () => {
        return {
          close: 'gray-3',
          search: 'gray-3'
        }
      }
    }
  },
  data() {
    return {
      keyword: this.defaultKeyword
    }
  },
  watch: {
    defaultKeyword(val) {
      this.keyword = val
    }
  },
  methods: {
    inputStyles() {
      return { fontFamily: this.fontFamily }
    },
    onSearch(event: Event) {
      event.preventDefault()
      this.$emit('search', this.keyword)
    },
    onClear() {
      this.keyword = ''
      this.$emit('search', '')
    },
    onUpdate() {
      this.$emit('update', this.keyword)
    }
  }
})
</script>

<style lang="scss" scoped>
.search-bar {
  @include size(100%, 42px);
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 5px 16px;
  box-sizing: border-box;
  border-radius: 3px;
  &__input {
    flex: 1;
    margin: 0 4px;
    padding: 0;
    background-color: transparent;
    // Remove webkit default magnifier & cancle icon for search input, https://stackoverflow.com/a/23296152
    -webkit-appearance: textfield;
    &::-webkit-search-cancel-button { display: none; }
  }
}
</style>
