<template lang="pug">
div(:class="`tabs ${themeColor} ${themeType}`")
  div(v-for="(tab,index) in tabs"
      :key="tab"
      class="tabs__item"
      :style="tabStyle(index)"
      @click="switchTab(index)")
    span {{tab}}
    div(v-if="['default', 'narrow', 'stk'].includes(themeType)" class="tabs__underline")
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'

export default defineComponent({
  props: {
    tabs: {
      type: Array as PropType<string[]>,
      default: [] as string[]
    },
    // Use v-model to bind tabIndex.
    modelValue: {
      type: Number,
      required: true
    },
    theme: {
      type: String as PropType<'dark' | 'light' | 'dark-rect' | 'dark-narrow' | 'light-narrow' | 'light-stk'>,
      default: 'dark'
    }
  },
  emits: ['update:modelValue'],
  computed: {
    tabIndex() {
      return this.modelValue
    },
    themeColor(): 'dark' | 'light' {
      return this.theme.split('-')[0] as 'dark' | 'light'
    },
    themeType(): 'default' | 'rect' | 'narrow' {
      return this.theme.split('-')[1] as 'rect' | 'narrow' | undefined ?? 'default'
    },
    colors() {
      switch (this.theme) {
        case 'light':
          return {
            active: '#4EABE6',
            inactive: '#969BAB'
          }
        case 'light-stk':
          return {
            active: '#141414',
            inactive: '#969BAB'
          }
        case 'dark-rect':
          return {
            active: '#18191F',
            activeBG: '#E8E8E8',
            inactive: '#9C9C9C',
            inactiveBG: '#2E2E2E'
          }
        case 'light-narrow':
          return {
            active: '#474A57',
            inactive: '#969BAB'
          }
        case 'dark-narrow':
          return {
            active: '#FFFFFF',
            inactive: '#969BAB'
          }
        case 'dark':
        default:
          return {
            active: 'white',
            inactive: '#9C9C9C'
          }
      }
    },
  },
  methods: {
    tabStyle(tabIndex: number) {
      const isActive = tabIndex === this.tabIndex
      const activeMode = isActive ? 'active' : 'inactive'
      switch (this.themeType) {
        case 'rect':
          return {
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            margin: '0 8px 0 8px',
            width: `calc(100% / ${this.tabs.length} - 16px)`,
            height: '36px',
            borderRadius: '10px',
            color: this.colors[activeMode],
            backgroundColor: this.colors[`${activeMode}BG`]
          }
        case 'narrow':
          return {
            color: this.colors[activeMode],
            '--border-color': isActive ? this.colors[activeMode] : 'transparent',
          }
        default:
          return {
            color: this.colors[activeMode],
            '--border-color': isActive ? this.colors[activeMode] : 'transparent',
            width: `${100 / this.tabs.length / 2}%`
          }
      }
    },
    switchTab(tabIndex: number) {
      this.$emit('update:modelValue', tabIndex)
    }
  }
})
</script>

<style lang="scss" scoped>
.tabs {
  width: 100%;
  height: fit-content;
  display: flex;
  align-items: center;
  justify-content: space-around;
  white-space: nowrap;
  &__item {
    box-sizing: border-box;
    text-align: center;
    transition: all 0.2s;
  }
  &__underline {
    margin-top: 4px;
    border: 1px solid var(--border-color);
    border-radius: 1px;
  }

  &.default, &.rect, &.stk {
    @include text-H6;
  }
  &.narrow {
    @include body-XS;
    justify-content: initial;
    gap: 16px;
  }
  &.default, &.stk {
    .tabs__item {
      min-width: fit-content;
    }
  }
}
</style>
