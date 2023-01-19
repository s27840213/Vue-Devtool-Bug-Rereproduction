<template lang="pug">
div(class="tabs" :style="tabsStyle")
  div(v-for="(tab,index) in tabs"
      class="tabs__item"
      :style="tabStyle(index)"
      @click="switchTab(index)")
    span(
      class="text-H6") {{tab}}
</template>

<script lang="ts">
import { PropType, defineComponent } from 'vue'

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
      type: String as PropType<'dark'|'light'|'dark-rect'>,
      default: 'dark'
    }
  },
  emits: ['update:modelValue'],
  computed: {
    tabIndex() {
      return this.modelValue
    },
    colors() {
      switch (this.theme) {
        case 'light':
          return {
            active: '#4EABE6',
            inactive: '#969BAB'
          }
        case 'dark-rect':
          return {
            active: '#18191F',
            activeBG: '#E8E8E8',
            inactive: '#9C9C9C',
            inactiveBG: '#2E2E2E'
          }
        case 'dark':
        default:
          return {
            active: 'white',
            inactive: '#9C9C9C'
          }
      }
    },
    tabsStyle() {
      const type = this.theme.split('-')[1]
      return type === 'rect' ? {
      } : {
        marginBottom: '24px'
      }
    }
  },
  methods: {
    tabStyle(tabIndex: number) {
      const isActive = tabIndex === this.tabIndex
      const activeMode = isActive ? 'active' : 'inactive'
      const type = this.theme.split('-')[1]
      return type === 'rect'
        ? {
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          margin: '0 8px 0 8px',
          width: `calc(100% / ${this.tabs.length} - 16px)`,
          height: '36px',
          borderRadius: '10px',
          color: this.colors[activeMode],
          backgroundColor: this.colors[`${activeMode}BG` as 'activeBG'|'inactiveBG']
        }
        : {
          paddingBottom: '4px',
          minWidth: 'fit-content',
          color: this.colors[activeMode],
          borderBottom: isActive ? `2px solid ${this.colors[activeMode]}` : '2px solid transparent',
          width: `${100 / this.tabs.length / 2}%`
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
  display: flex;
  align-items: center;
  justify-content: space-around;
  &__item {
    box-sizing: border-box;
    text-align: center;
    transition: all 0.2s;
  }
}
</style>
