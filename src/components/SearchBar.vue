<template lang="pug">
  form(class="search-bar bg-gray-6"
    :class="[{ vivisticker: vivisticker !== 'none' }, vivisticker]"
    @submit="onSearch")
    input(class="search-bar__input body-2"
      :class="[{ vivisticker: vivisticker !== 'none' }, vivisticker]"
      type="text"
      v-model="keyword"
      @input="onUpdate"
      :placeholder="placeholder"
      :style="inputStyles()")
    svg-icon(v-if="clear && keyword"
      class="pointer mr-5"
      :class="[{ vivisticker: vivisticker !== 'none' }, vivisticker]"
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
    },
    vivisticker: {
      type: String,
      default: 'none'
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
  &.vivisticker {
    padding: 8px 12px 8px 16px;
    border-radius: 10px;
    &.dark {
      background: setColor(black-3);
      & > input {
        color: white;
        &::placeholder {
          color: setColor(black-5);
        }
      }
    }
    &.white {
      background: setColor(gray-6);
      & > input {
        color: setColor(gray-1);
        &::placeholder {
          color: setColor(gray-3);
        }
      }
    }
    & > input {
      padding: 0;
      margin-top: 0;
      margin-bottom: 0;
      height: 26px;
    }
  }
  &__input {
    flex: 1;
    margin-right: 10px;
    background-color: transparent;
    &.vivisticker {
      @include body-SM;
    }
  }
  & > svg.vivisticker {
    margin-right: 12px;
  }
}
</style>
