<template lang="pug">
  div(class="popup-align bg-white")
    div(class="popup-align__group")
      div
        span {{$t('NN0045')}}
      div
        div(v-for="(data,index) in alignDatas()"
            :key="`popup-${index}`"
            class="popup-align__item"
            @click="MappingUtils.mappingIconAction(data.icon)")
          svg-icon(
            class="pointer"
            :iconName="data.icon"
            :iconWidth="'18px'"
            :iconColor="'gray-1'")
          span(class="ml-5 body-2") {{data.text}}
    hr(v-if="layerNum >=3" class="popup-align__hr")
    div(v-if="layerNum >=3" class="popup-align__group")
      div
        span {{$t('NN0219')}}
      div
        div(v-for="(data,index) in distributeDatas()"
            :key="`popup-${index}`"
            class="popup-align__item"
            @click="MappingUtils.mappingIconAction(data.icon)")
          svg-icon(
            class="pointer"
            :iconName="data.icon"
            :iconWidth="'16px'"
            :iconColor="'gray-1'")
          span(class="ml-5 body-2") {{data.text}}
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import MappingUtils from '@/utils/mappingUtils'
import { mapGetters, mapMutations } from 'vuex'
import { ICurrSelectedInfo } from '@/interfaces/editor'

export default defineComponent({
  data() {
    return {
      MappingUtils
    }
  },
  computed: {
    ...mapGetters({
      currSelectedInfo: 'getCurrSelectedInfo'
    }),
    layerNum(): number {
      return (this.currSelectedInfo as ICurrSelectedInfo).layers.length
    }
  },
  methods: {
    mappingIcons(type: string): string[] {
      return MappingUtils.mappingIconSet(type)
    },
    alignDatas() {
      const icons = this.mappingIcons('align')
      const texts = [`${this.$t('NN0046')}`, `${this.$t('NN0047')}`, `${this.$t('NN0048')}`, `${this.$t('NN0049')}`, `${this.$t('NN0050')}`, `${this.$t('NN0051')}`]

      return icons.map((icon: string, index: number) => {
        return {
          icon: icon,
          text: texts[index]
        }
      })
    },
    distributeDatas() {
      const icons = this.mappingIcons('distribute')
      const texts = [`${this.$t('NN0221')}`, `${this.$t('NN0222')}`]
      return icons.map((icon: string, index: number) => {
        return {
          icon: icon,
          text: texts[index]
        }
      })
    }
  }
})
</script>

<style lang="scss" scoped>
.popup-align {
  padding: 0.375rem 0.625rem;
  &__group {
    // heading
    > div:nth-child(1) {
      display: flex;
      justify-content: flex-start;
      margin-bottom: 0.5rem;
      > span {
        font-size: 0.75rem;
      }
    }
    > div:nth-child(2) {
      display: grid;
      grid-auto-rows: auto;
      grid-template-columns: repeat(3, 1fr);
      column-gap: 0.5rem;
      row-gap: 0.5rem;
      > div {
        display: flex;
        flex-direction: column;
      }
    }
  }

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
