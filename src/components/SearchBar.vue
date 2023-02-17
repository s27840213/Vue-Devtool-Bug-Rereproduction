<template lang="pug">
  div(class="wrapper")
    //- Show search button on mobile, https://www.paddingleft.com/2019/09/18/Show-Search-on-mobile-devices-keyboard
    form(class="search-bar bg-gray-6"
      :class="[{ vivisticker: vivisticker !== 'none' }, vivisticker]"
      action @submit="onSearch")
      svg-icon(class="pointer"
        iconName="search"
        :iconColor="color.search || 'gray-3'"
        iconWidth="20px")
      input(class="search-bar__input body-2"
        :class="[{ vivisticker: vivisticker !== 'none' }, vivisticker]"
        ref="searchbar"
        type="search"
        v-model="keyword"
        @input="onUpdate"
        :placeholder="placeholder"
        :style="inputStyles()")
      svg-icon(v-if="clear && keyword"
        class="pointer"
        :class="[{ vivisticker: vivisticker !== 'none' }, vivisticker]"
        iconName="close"
        :iconColor="color.close || 'gray-3'"
        iconWidth="20px"
        @click.native="onClear")
      slot
    div(v-if="isFavorite !== undefined"
        class="search-bar__favorite")
      svg-icon(:iconName="isFavorite ? 'favorites-fill' : 'heart'"
        class="pointer"
        :class="[{ vivisticker: vivisticker !== 'none' }, vivisticker]"
        :iconColor="color.close || 'gray-3'"
        iconWidth="24px"
        @click.native="clickHeart")
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
    },
    isFavorite: {
      type: Boolean,
      default: undefined
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
      event.preventDefault();
      (this.$refs.searchbar as HTMLElement).blur()
      this.$emit('search', this.keyword)
    },
    onClear() {
      this.keyword = ''
      this.$emit('search', '')
    },
    onUpdate() {
      this.$emit('update', this.keyword)
    },
    clickHeart() {
      this.$emit('favorite')
    }
  }
})
</script>

<style lang="scss" scoped>
.wrapper {
  display: grid;
  grid-template-columns: 1fr auto;
}

.search-bar {
  @include size(100%, 42px);
  display: grid;
  grid-auto-flow: column;
  grid-template-columns: auto 1fr;
  align-items: center;
  gap: 4px;
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
    padding: 0;
    background-color: transparent;
    &.vivisticker {
      @include body-SM;
    }
    // Remove webkit default magnifier, cancle icon & bg color for search input, https://stackoverflow.com/a/23296152
    -webkit-appearance: none;
    &::-webkit-search-cancel-button { display: none; }
  }
  & > svg.vivisticker {
    margin-right: 12px;
  }
}

.search-bar__favorite {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 42px;
  height: 42px;
  margin-left: 8px;
  background-color: setColor(black-3);
  border-radius: 10px;
}
</style>
