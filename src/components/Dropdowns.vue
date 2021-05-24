<template lang="pug">
  div(class="dropdowns bg-gray-6"
      :class="`dropdowns--${type}`")
    div(v-for="(data,index) in dropdownsDatas(type)"
        :key="`dropdowns-${index}`"
        class="dropdowns__item"
        @click="data.action")
      svg-icon(
        class="pointer"
        :iconName="data.icon"
        :iconWidth="'16px'"
        :iconColor="'gray-1'")
      span(class="ml-10 body-2") {{data.text}}
</template>

<script lang="ts">
import Vue from 'vue'
import MappingUtils from '@/utils/mappingUtils'

export default Vue.extend({
  props: {
    hasImage: {
      type: Boolean,
      default: true
    },
    type: String,
    datas: Array
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
            'Bring to Front',
            'Bring Forward',
            'Bring Backward',
            'Bring to Back'
          ]
        }
        default: {
          return []
        }
      }
    },
    dropdownsDatas(type: string) {
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
.dropdowns {
  width: initial;
  height: initial;
  border-radius: 5px;
  display: flex;
  flex-direction: column;
  position: absolute;
  left: 0;
  top: 0;
  z-index: setZindex("dropdowns");
  justify-content: center;
  border: 1px solid setColor(gray-4);
  &:focus {
    outline: none;
  }
  &__item {
    display: flex;
    padding: 5px;
    &:active {
      background-color: setColor(blue-3);
    }
  }
}
</style>
