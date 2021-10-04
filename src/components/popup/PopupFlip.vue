<template lang="pug">
  div(class="popup-flip")
    div(v-for="(data,index) in popupDatas()"
        :key="`popup-${index}`"
        class="popup-flip__item"
        @click="data.action")
      svg-icon(
        class="pointer"
        :iconName="data.icon"
        :iconWidth="'12px'"
        :iconColor="'gray-1'")
      span(class="ml-5 body-2") {{data.text}}
</template>

<script lang="ts">
import Vue from 'vue'
import { mapGetters } from 'vuex'

export default Vue.extend({
  data() {
    return {
    }
  },
  computed: {
    ...mapGetters({
      currSelectedInfo: 'getCurrSelectedInfo',
      currSubSelectedInfo: 'getCurrSubSelectedInfo'
    }),
    isGroup(): boolean {
      return this.currSelectedInfo.types.has('group') && this.currSelectedInfo.layers.length === 1
    }
  },
  methods: {
    popupDatas() {
      const icons = ['flip-h', 'flip-v']
      const texts = ['水平翻轉', '垂直翻轉']
      const actions = [this.applyHorizontalFlip, this.applyVerticalFlip]
      return icons.map((icon: string, index: number) => {
        return {
          icon: icons[index],
          text: texts[index],
          action: actions[index]
        }
      })
    },
    applyFlip(updateStyle: {[key: string]: boolean}) {
      this.$store.commit('UPDATE_layerStyles', {
        pageIndex: this.currSelectedInfo.pageIndex,
        layerIndex: this.currSelectedInfo.index,
        styles: updateStyle
      })
    },
    applyHorizontalFlip() {
      if (!this.isGroup) {
        if (this.currSelectedInfo.layers.length === 1) {
          this.applyFlip({
            horizontalFlip: !this.currSelectedInfo.layers[0].styles.horizontalFlip
          })
        }
      }
    },
    applyVerticalFlip() {
      if (!this.isGroup) {
        if (this.currSelectedInfo.layers.length === 1) {
          this.applyFlip({
            verticalFlip: !this.currSelectedInfo.layers[0].styles.verticalFlip
          })
        }
      }
    }
  }
})
</script>

<style lang="scss" scoped>
.popup-flip {
  &__item {
    display: flex;
    align-items: center;
    transition: background-color 0.1s ease-in;
    padding: 0.25rem 0.5rem;
    border-radius: 0.25rem;
    &:hover {
      background-color: setColor(blue-3, 0.5);
    }
    &:active {
      background-color: setColor(blue-3);
    }
    > span {
      font-size: 0.75rem;
    }
  }
}
</style>
