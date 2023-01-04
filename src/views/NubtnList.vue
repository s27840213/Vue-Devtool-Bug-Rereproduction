<template lang="pug">
div(class="btnList" :style="BGstyle")
  div(class="btnList-options")
    Checkbox(v-model="full") full size
    Checkbox(v-model="darkBG") dark BG
    div
      span {{'button text: '}}
      input(type="text" v-model="btnText")
    div
      span {{'button icon: '}}
      input(type="text" v-model="btnIcon")
  div(class="btnList-table")
    span
    span(v-for="btn in btns") {{btn.theme}} ({{btn.size}})
    template(v-for="status in statuses")
      span {{status}}
      Nubtn(v-for="btn in btns"
            :theme="btn.theme" :size="`${btn.size}${full?'-full':''}`"
            :status="status" :icon="btnIcon" :hint="btnText") {{btnText}}
  hr(style="width: 50%")
  div(class="btnList-options")
    div 邏輯測試區塊
    span 可以測試點擊切換active/default邏輯，disable邏輯(不觸發click、不從內部改變狀態)，click事件觸發邏輯
    div(class="flex-center")
      span 邏輯測試按鈕的狀態：
      options(:options="statuses" v-model="testBtnStatus")
    div(class="flex-center")
      span 邏輯測試按鈕的主題：
      options(:options="themes" v-model="testBtnTheme")
    Nubtn(:theme="testBtnTheme" v-model="testBtnStatus"
          icon="download" :hint="'邏輯測試按鈕'" @click="click") 邏輯測試按鈕，下拉選單可改變/觀察此按鈕狀態(此按鈕會切換active)
    Nubtn(:theme="testBtnTheme" :status="testBtnStatus"
          icon="download" :hint="'邏輯測試按鈕'" @click="click") 邏輯測試按鈕，下拉選單可改變/觀察此按鈕狀態(此按鈕不會active)
    Nubtn(:theme="testBtnTheme"
          icon="download" :hint="'邏輯測試按鈕'" @click="click") 邏輯測試按鈕，此按鈕狀態沒有連動，僅hover
</template>

<script lang="ts">
import Vue from 'vue'
import Checkbox from '@/components/global/Checkbox.vue'
import Options from '@/components/global/Options.vue'

export default Vue.extend({
  name: 'NubtnList',
  components: {
    Checkbox,
    Options
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
      themes: ['primary', 'outline', 'text', 'icon_text', 'icon',
        'ghost', 'ghost_outline', 'danger', 'secondary'],
      full: false,
      darkBG: true,
      btnText: 'button',
      btnIcon: 'download',
      testBtnStatus: 'default',
      testBtnTheme: 'primary'
    }
  },
  computed: {
    BGstyle(): Record<string, string> {
      return this.darkBG ? {
        backgroundColor: '#2C2F43',
        color: 'white'
      } : {
        backgroundColor: 'white',
        color: 'black'
      }
    }
  },
  methods: {
    click() {
      this.$notify({ group: 'copy', text: 'click!' })
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
  padding: 20px 40px;
  box-sizing: border-box;
  overflow-y: auto;
  &-options input, &-options select {
    width: 150px;
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
