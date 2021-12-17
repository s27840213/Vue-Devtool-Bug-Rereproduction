<template lang="pug">
  div(class="popup-flip")
    div(v-for="(data,index) in popupDatas()"
        :key="`popup-${index}`"
        class="popup-flip__item"
        @click="MappingUtils.mappingIconAction(data.icon)")
      svg-icon(
        class="pointer"
        :iconName="data.icon"
        :iconWidth="'12px'"
        :iconColor="'gray-1'")
      span(class="ml-5 body-2") {{data.text}}
</template>

<script lang="ts">
import MappingUtils from '@/utils/mappingUtils'
import Vue from 'vue'

export default Vue.extend({
  data() {
    return {
      MappingUtils
    }
  },
  methods: {
    popupDatas() {
      const icons = ['flip-h', 'flip-v']
      const texts = [`${this.$t('NN0053')}`, `${this.$t('NN0054')}`]
      return icons.map((icon: string, index: number) => {
        return {
          icon: icons[index],
          text: texts[index]
        }
      })
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
