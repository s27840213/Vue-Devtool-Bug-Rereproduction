<template lang="pug">
div(class="svg-icon-view bg-nav")
  div(class="svg-icon-view__icon pointer" v-for="icon in icons" :key="icon" @click="copyText(icon)")
    svg-icon(class="pointer"
      :iconName="icon"
      :iconWidth="'30px'"
      :iconColor="'white'")
    span(class="text-white") {{icon}}
</template>

<script lang="ts">
import generalUtils from '@/utils/generalUtils'
import svgIconUtils from '@/utils/svgIconUtils'
import { notify } from '@kyvg/vue3-notification'
import { defineComponent } from 'vue'

export default defineComponent({
  emits: [],
  name: 'SvgIconView',
  data() {
    const icons = svgIconUtils.icons
    return {
      icons
    }
  },
  methods: {
    copyText(text: string) {
      generalUtils.copyText(text)
        .then(() => {
          notify({ group: 'copy', text: `${text} 已複製` })
        })
    }
  }
})
</script>

<style lang="scss" scoped>
.svg-icon-view {
  width: 100%;
  height: 100%;
  padding: 40px 80px;
  box-sizing: border-box;
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  justify-items: center;
  align-items: center;
  grid-auto-rows: auto;
  row-gap: 35px;
  column-gap: 15px;
  overflow: scroll;

  &__icon {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;

    > span {
      font-size: 12px;
      margin-top: 5px;
    }
  }
}
</style>
