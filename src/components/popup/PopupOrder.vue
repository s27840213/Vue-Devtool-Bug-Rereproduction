<template lang="pug">
  div(class="popup-order")
    div(v-for="(data,index) in popupDatas()"
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
import { defineComponent } from 'vue'
import MappingUtils from '@/utils/mappingUtils'
import { mapMutations } from 'vuex'
import vClickOutside from 'v-click-outside'

export default defineComponent({
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
      orderSets: [
        {
          icon: 'layers-forward',
          text: this.$t('NN0232')
        },
        {
          icon: 'layers-front',
          text: this.$t('NN0231')
        },
        {
          icon: 'layers-backward',
          text: this.$t('NN0233')
        },
        {
          icon: 'layers-back',
          text: this.$t('NN0234')
        }]
    }
  },
  methods: {
    mappingIcons(type: string): string[] {
      return MappingUtils.mappingIconSet(type)
    },
    popupDatas() {
      return this.orderSets.map((set) => {
        return {
          icon: set.icon,
          text: set.text,
          action: MappingUtils.mappingIconAction(set.icon)
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
