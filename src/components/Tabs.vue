<template lang="pug">
  div(class="tabs")
    div(v-for="(tab,index) in tabs"
        class="tabs__item"
        :class="tabStyle(index)"
        @click="switchTab(index)")
      span(
        class="subtitle-2") {{tab}}
</template>

<script lang="ts">
import Vue, { PropType } from 'vue'

export default Vue.extend({
  props: {
    tabs: {
      type: Array as PropType<string[]>,
      default: () => []
    },
    theme: {
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
  },
  methods: {
    tabStyle(tabIndex: number) {
      return tabIndex === this.currActiveTabIndex ? 'text-white show-border ' : 'text-gray-3'
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
  color: white;
  margin-bottom: 24px;
  &__item {
    width: 20%;
    padding: 4px 0px;
    transition: border-color 0.2s, color 0.2s;
    box-sizing: border-box;
    border-bottom: 2px solid transparent;
  }
}

.show-border {
  border-bottom: 2px solid setColor(white);
}
</style>
