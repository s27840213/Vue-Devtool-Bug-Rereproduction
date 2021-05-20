<template lang="pug">
  div(class="text-setting")
    span(class="text-setting__title text-blue-1 label-lg") Text Setting
    property-bar
      span(class="body-2 text-gray-2") Pass Through
      svg-icon(class="pointer"
        :iconName="'caret-down'" :iconWidth="'10px'" :iconColor="'gray-2'")
    div(class="text-setting__row2")
      property-bar
        span(class="body-2 text-gray-2") 40
        svg-icon(class="pointer"
          :iconName="'caret-down'" :iconWidth="'10px'" :iconColor="'gray-2'")
      div(class="text-setting__color-picker")
        div(class="color-slip" class="bg-gray-1")
        div(class="full-width text-left ml-10")
          span(class="body-2 text-gray-2") #222222
    action-bar(class="flex-evenly")
      svg-icon(v-for="(icon,index) in mappingIcons('font')"
        :key="`gp-action-icon-${index}`"
        class="pointer"
        :iconName="icon" :iconWidth="'20px'" :iconColor="'gray-2'")
    action-bar(class="flex-evenly")
      svg-icon(v-for="(icon,index) in mappingIcons('font-align')"
        :key="`gp-action-icon-${index}`"
        class="pointer"
        :iconName="icon" :iconWidth="'20px'" :iconColor="'gray-2'")
    div(class="text-setting__row5")
      property-bar
        span(class="body-2 text-gray-2") 40
        svg-icon(class="pointer"
          :iconName="'font-height'" :iconWidth="'20px'" :iconColor="'gray-2'")
      property-bar
        span(class="body-2 text-gray-2") 10%
        svg-icon(class="pointer"
          :iconName="'font-spacing'" :iconWidth="'20px'" :iconColor="'gray-2'")
      property-bar
        span(class="body-2 text-gray-2") 100
        svg-icon(class="pointer"
          :iconName="'transparency'" :iconWidth="'20px'" :iconColor="'gray-2'")
</template>

<script lang="ts">
import Vue from 'vue'
import SearchBar from '@/components/SearchBar.vue'
import MappingUtils from '@/utils/mappingUtils'

export default Vue.extend({
  components: {
    SearchBar
  },
  methods: {
    mappingIcons(type: string) {
      return MappingUtils.mappingIconSet(type)
    }
  }
})
</script>

<style lang="scss" scoped>
.text-setting {
  text-align: left;
  &__title {
    margin-bottom: 30px;
  }
  > div {
    margin-top: 15px;
    &:nth-child(1) {
      margin-top: 0px;
    }
  }

  &__row2 {
    display: grid;
    grid-template-rows: 1fr;
    grid-template-columns: 2fr 3fr;
    column-gap: 20px;
  }
  &__row5 {
    display: grid;
    grid-template-rows: auto auto;
    grid-template-columns: 1fr 1fr;
    row-gap: 10px;
    column-gap: 20px;
  }
  &__color-picker {
    display: flex;
    align-items: center;
    justify-content: space-between;
    border: 1px solid setColor(gray-4);
    border-radius: 3px;
  }
}
.color-slip {
  height: 100%;
  width: 40%;
}
</style>
