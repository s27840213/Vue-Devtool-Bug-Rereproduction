<template lang="pug">
  div(class="footer-tabs")
    div(class="footer-tabs__item" v-for="(item, index) in navItem"
        @click="handleItemAction(item, index)")
      svg-icon(class="mb-5"
        :iconName="item.icon"
        :iconColor="currAcitveTab === index ? 'blue-1' :'white'"
        :iconWidth="'20px'")
      span(class="text-white text-body-4 no-wrap") {{item.text}}
</template>
<script lang="ts">
import Vue from 'vue'

export default Vue.extend({
  components: {
  },
  props: {
  },
  data() {
    return {
      currAcitveTab: -1
    }
  },
  computed: {
    navItem(type?: string): Array<{ icon: string, text: string }> {
      return [
        { icon: 'template', text: `${this.$tc('NN0001', 2)}` },
        { icon: 'photo', text: `${this.$tc('NN0002', 2)}` },
        { icon: 'shape', text: `${this.$tc('NN0003', 2)}` },
        { icon: 'bg', text: `${this.$tc('NN0004', 2)}` },
        { icon: 'text', text: `${this.$tc('NN0005', 2)}` },
        { icon: 'upload', text: `${this.$tc('NN0006')}` }
        // { icon: 'brand', text: `${this.$t('NN0007')}` }
      ]
    }
  },
  methods: {
    handleItemEvent(item: { icon: string, text: string, action: () => void }, index: number) {
      this.currAcitveTab = index
    }
  }
})
</script>

<style lang="scss" scoped>
.footer-tabs {
  overflow: scroll;
  display: grid;
  grid-template-rows: auto;
  grid-auto-flow: column;
  column-gap: 32px;
  background-color: setColor(nav);
  padding: 8px 12px;
  @include no-scrollbar;

  &__item {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
    padding: 0px 4px;
    > span {
      transform: scale(0.833);
    }
  }
}
</style>
