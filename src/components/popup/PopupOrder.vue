<template lang="pug">
  div(class="popup-order")
    div(v-for="(data,index) in popupDatas('order')"
        :key="`popup-order-${index}`"
        class="popup-order__item"
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
import MappingUtils from '@/utils/mappingUtils'
import { mapMutations } from 'vuex'
import vClickOutside from 'v-click-outside'

export default Vue.extend({
  props: {
    hasImage: {
      type: Boolean,
      default: true
    },
    type: String,
    datas: Array
  },
  directives: {
    clickOutside: vClickOutside.directive
  },
  data() {
    return {
    }
  },
  methods: {
    mappingIcons(type: string): string[] {
      return MappingUtils.mappingIconSet(type)
    },
    mappingText(type: string): string[] {
      switch (type) {
        case 'order': {
          return [
            `${this.$t('NN0232')}`,
            `${this.$t('NN0231')}`,
            `${this.$t('NN0233')}`,
            `${this.$t('NN0234')}`
          ]
        }
        case 'layer': {
          return [
            'Copy',
            'Paste',
            'Delete'
          ]
        }
        default: {
          return []
        }
      }
    },
    popupDatas(type: string) {
      const icons = this.mappingIcons(type)
      const texts = this.mappingText(type)
      return icons.map((icon: string, index: number) => {
        return {
          icon: icon,
          text: texts[index],
          action: MappingUtils.mappingIconAction(icon)
        }
      })
    }
  }
})
</script>

<style lang="scss" scoped>
.popup-order {
  display: grid;
  grid-template-rows: auto auto;
  grid-template-columns: auto auto;
  column-gap: 0.5rem;
  padding: 0.375rem 0.625rem;
  &__item {
    display: flex;
    align-items: center;
    transition: background-color 0.1s ease-in;
    padding: 0.125rem 0.25rem;
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
