<template lang="pug">
  div(class="tabs")
    div(v-for="(tab,index) in tabs"
        class="tabs__item"
        :style="tabStyle(index)"
        @click="switchTab(index)")
      span(
        class="text-H6") {{tab}}
</template>

<script lang="ts">
import Vue, { PropType } from 'vue'

export default Vue.extend({
  props: {
    tabs: {
      type: Array as PropType<string[]>,
      default: () => []
    },
    theme: { // value: dark, light
      type: String,
      default: 'dark'
    }
  },
  data() {
    return {
      currActiveTabIndex: 0
    }
  },
  computed: {
    colors() {
      switch (this.theme) {
        case 'light':
          return {
            active: '#4EABE6',
            inactive: '#969BAB'
          }
        case 'dark':
        default:
          return {
            active: 'white',
            inactive: '#969BAB'
          }
      }
    }
  },
  methods: {
    tabStyle(tabIndex: number) {
      const activeMode = tabIndex === this.currActiveTabIndex ? 'active' : 'inactive'
      return {
        color: this.colors[activeMode],
        width: `${100 / this.tabs.length / 2}%`,
        ...(activeMode === 'active' ? { borderBottom: `2px solid ${this.colors[activeMode]}` } : {})
      }
    },
    switchTab(tabIndex: number) {
      this.currActiveTabIndex = tabIndex
      this.$emit('switchTab', tabIndex)
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
  margin-bottom: 24px;
  &__item {
    padding-bottom: 4px;
    box-sizing: border-box;
    min-width: fit-content;
    transition: border-color 0.2s, color 0.2s;
    border-bottom: 2px solid transparent;
  }
}
</style>
