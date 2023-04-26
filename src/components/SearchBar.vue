<template lang="pug">
div(class="search-bar" :class="{vivisticker: vivisticker !== 'none'}")
  div(class="search-bar__wrapper" :class="{vivisticker: vivisticker !== 'none', collapsed, favorite: isFavorite !== undefined}" ref="wrapper")
    div(v-if="isFavorite !== undefined"
        class="search-bar__favorite")
      svg-icon(:iconName="isFavorite ? 'favorites-fill' : 'heart'"
        class="pointer"
        :class="[{ vivisticker: vivisticker !== 'none', favorite: isFavorite }, vivisticker]"
        :iconColor="color.close || 'gray-3'"
        iconWidth="24px"
        @click="clickHeart")
    //- Show search button on mobile, https://www.paddingleft.com/2019/09/18/Show-Search-on-mobile-devices-keyboard
    form(class="search-bar__form bg-gray-6"
      :class="[{ vivisticker: vivisticker !== 'none' }, vivisticker]"
      action="" @submit="onSearch")
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
        @click="onClear")
      slot
    //- placeholder
    span(v-if="expanded !== undefined" class="placeholder") {{ $t('NN0203') }}
  div(v-if="expanded !== undefined" class="search-bar__switch")
    //- placeholder
    span(class="placeholder") {{ $t('NN0203') }}
    div(class="search-bar__switch__text" :class="{collapsed}" @click="$emit('update:expanded', false)") {{ $t('NN0203') }}
    div(class="search-bar__switch__icon" :class="{collapsed}" @click="$emit('update:expanded', true)")
      svg-icon(class="pointer"
            iconName="search"
            iconColor="white"
            iconWidth="20px")
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  components: {
  },
  props: {
    placeholder: {
      type: String,
      required: true
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
    },
    expanded: {
      type: Boolean,
      default: undefined
    }
  },
  emits: ['search', 'update', 'favorite', 'update:expanded', 'cancel'],
  data() {
    return {
      keyword: this.defaultKeyword
    }
  },
  watch: {
    defaultKeyword(val) {
      this.keyword = val
    },
    expanded(val) {
      if (val && !this.defaultKeyword) this.focus()
      if (!val) {
        (this.$refs.searchbar as HTMLElement).blur()
        this.$emit('cancel')
      }
    }
  },
  computed: {
    collapsed(): boolean {
      if (this.expanded === undefined) return false
      return !this.expanded
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
    },
    // can be called by @/components/vivisticker/us/PanelObject.vue and @/components/vivisticker/us/PanelBackground.vue
    focus() {
      (this.$refs.searchbar as HTMLInputElement).focus()
    }
  }
})
</script>

<style lang="scss" scoped>
.search-bar {
  &.vivisticker {
    position: relative;
    display: grid;
  }
  &__switch {
    height: 42px;
    position: absolute;
    right: 0;
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1;
    pointer-events: none;
    &__icon {
      @include size(32px);
      position: absolute;
      top: 50%;
      right: 0;
      transform: translateY(-50%);
      display: flex;
      justify-content: center;
      align-items: center;
      visibility: hidden;
      pointer-events: none;
      &.collapsed {
        pointer-events: all;
        visibility: visible;
      }
    }
    &__text {
      position: absolute;
      top: 50%;
      right: 50%;
      transform: translate(50%, -50%);
      white-space: nowrap;
      pointer-events: all;
      &.collapsed {
        pointer-events: none;
        visibility: hidden;
      }
    }
  }
  &__wrapper {
    display: grid;
    grid-template-columns: 1fr auto;
    &.vivisticker {
      column-gap: v-bind("expanded === undefined ? '0' : '10px'");
      clip-path: inset(0 0 0 0);
      transition: clip-path 200ms 100ms ease-in-out;
      transform: translateZ(0);
      &.collapsed {
        pointer-events: none;
        clip-path: inset(0 0 100% 0);
      }
      &.favorite {
        grid-template-columns: auto 1fr auto;
      }
    }
  }
  &__form {
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
  background-color: setColor(black-3);
  border-radius: 10px;
  & > svg.vivisticker {
    transition: none;
    &.favorite {
      color: #FC5757
    }
  }
}
.placeholder {
  visibility: hidden;
}
</style>
