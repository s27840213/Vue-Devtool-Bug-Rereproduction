<template lang="pug">
  div(class="footer-tabs")
    div(class="footer-tabs__item" v-for="(item, index) in tabItem"
        @click="handleItemAction(item.type)")
      svg-icon(class="mb-5"
        :iconName="item.icon"
        :iconColor="currTab ===  item.type ? 'blue-1' :'white'"
        :iconWidth="'20px'")
      span(class="text-body-4 no-wrap"
      :class="(currTab ===  item.type ) ? 'text-blue-1' : 'text-white'") {{item.text}}
</template>
<script lang="ts">
import Vue from 'vue'

export default Vue.extend({
  components: {
  },
  props: {
    currTab: {
      default: 'none',
      type: String
    }
  },
  data() {
    return {
      currAcitvePanel: -1
    }
  },
  computed: {
    tabItem(type?: string): Array<{ icon: string, text: string, type: string }> {
      return [
        { icon: 'template', text: `${this.$tc('NN0001', 2)}`, type: 'panel-template' },
        { icon: 'photo', text: `${this.$tc('NN0002', 2)}`, type: 'panel-photo' },
        { icon: 'shape', text: `${this.$tc('NN0003', 2)}`, type: 'panel-object' },
        { icon: 'bg', text: `${this.$tc('NN0004', 2)}`, type: 'panel-background' },
        { icon: 'text', text: `${this.$tc('NN0005', 2)}`, type: 'panel-text' },
        { icon: 'upload', text: `${this.$tc('NN0006')}`, type: 'panel-file' }
        // { type: 'brand', text: `${this.$t('NN0007')}` }
      ]
    }
  },
  methods: {
    handleItemAction(type: string) {
      this.$emit('switchTab', type)
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
