<template lang="pug">
div(class="btnList" :style="{backgroundColor: darkBG ? '#2C2F43' : 'white'}")
  div(class="btnList-options")
    Checkbox(v-model="width100") width: 100%
    Checkbox(v-model="darkBG") dark BG
    div
      span {{'button text: '}}
      input(type="type" v-model="btnText")
    div
      span {{'button icon: '}}
      input(type="type" v-model="btnIcon")
  div(class="btnList-table")
    span
    span(v-for="btn in btns") {{btn.theme}} ({{btn.size}})
    template(v-for="status in statuses")
      span {{status}}
      Nubtn(v-for="btn in btns"
            :theme="btn.theme" :size="`${btn.size}${width100?'-full':''}`"
            :status="status" :icon="btnIcon" v-hint="btnText") {{btnText}}
</template>

<script lang="ts">
import Vue from 'vue'
import Nubtn from '@/components/global/Nubtn.vue'
import Checkbox from '@/components/global/Checkbox.vue'

export default Vue.extend({
  name: 'NubtnList',
  components: {
    Nubtn,
    Checkbox
  },
  data() {
    return {
      btns: [{
        theme: 'primary',
        size: 'sm'
      }, {
        theme: 'primary',
        size: 'mid'
      }, {
        theme: 'icon_text',
        size: 'sm'
      }, {
        theme: 'icon_text',
        size: 'mid'
      }, {
        theme: 'outline',
        size: 'sm'
      }, {
        theme: 'outline',
        size: 'mid'
      }, {
        theme: 'text',
        size: 'sm'
      }, {
        theme: 'ghost',
        size: 'sm'
      }, {
        theme: 'ghost_outline',
        size: 'sm'
      }, {
        theme: 'icon',
        size: 'sm'
      }, {
        theme: 'danger',
        size: 'sm'
      }, {
        theme: 'secondary',
        size: 'sm'
      }],
      statuses: ['default', 'hover', 'disabled', 'active'],
      width100: false,
      darkBG: true,
      btnText: 'button',
      btnIcon: 'download'
    }
  }
})
</script>

<style lang="scss" scoped>
.btnList {
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100%;
  overflow-y: auto;
  &-options input {
    width: 100px;
  }
  &-table {
    display: grid;
    align-items: center;
    grid-auto-flow: column;
    grid-template-rows: repeat(13, auto);
    gap: 10px;
    width: fit-content;
  }
}
</style>
