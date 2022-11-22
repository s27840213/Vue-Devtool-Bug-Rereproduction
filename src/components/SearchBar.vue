<template lang="pug">
form(class="search-bar bg-gray-6"
  @submit="onSearch")
  input(class="search-bar__input body-2"
    type="text"
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
  svg-icon(class="pointer"
    iconName="search"
    :iconColor="color.search || 'gray-3'"
    iconWidth="20px"
    @click.native="onSearch")
  slot
</template>

<script lang="ts">
import i18n from '@/i18n'
import { defineComponent } from 'vue'
import { useI18n } from 'vue-i18n'

export default defineComponent({
  components: {
  },
  props: {
    placeholder: {
      type: String,
      default: `${useI18n().t('NN0092')}`
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
    margin-right: 10px;
    background-color: transparent;
  }
}
</style>
