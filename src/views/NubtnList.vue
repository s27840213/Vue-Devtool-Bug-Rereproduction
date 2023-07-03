<template lang="pug">
div(class="btnList" :style="BGstyle")
  div(class="btnList-options")
    checkbox(v-model="full") full size
    checkbox(v-model="darkBG") dark BG
    div
      span {{'button text: '}}
      input(type="text" v-model="btnText")
    div
      span {{'button icon: '}}
      input(type="text" v-model="btnIcon")
  div(class="btnList-table")
    span
    span(v-for="btn in btns" :key="btn.theme") {{btn.theme}} ({{btn.size}})
    template(v-for="status in statuses" :key="status")
      span {{status}}
      nubtn(v-for="btn in btns"
        :key="btn.theme"
        :theme="btn.theme"
        :size="`${full ? btn.size.replace('center', 'full') as INubtnSize : btn.size}`"
        :active="status==='active'"
        :disabled="status==='disabled'"
        :icon="btnIcon"
        :hint="btnText") {{btnText}}
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
    nubtn(:theme="testBtnTheme" size="sm-center"
          v-model:active="testBtnActive"
          :disabled="testBtnDisabled"
          icon="download" :hint="'邏輯測試按鈕'" @click="click") 邏輯測試按鈕，下拉選單可改變/觀察此按鈕狀態(此按鈕會切換active)
    nubtn(:theme="testBtnTheme" size="sm-center"
          :active="testBtnActive"
          :disabled="testBtnDisabled"
          icon="download" :hint="'邏輯測試按鈕'" @click="click") 邏輯測試按鈕，下拉選單可改變/觀察此按鈕狀態(此按鈕不會active)
    nubtn(:theme="testBtnTheme" size="sm-center"
          icon="download" :hint="'邏輯測試按鈕'" @click="click") 邏輯測試按鈕，此按鈕狀態沒有連動，僅hover
</template>

<script lang="ts">
import Checkbox from '@/components/global/Checkbox.vue'
import { INubtnSize, INubtnThemes } from '@/components/global/Nubtn.vue'
import Options from '@/components/global/Options.vue'
import { notify } from '@kyvg/vue3-notification'
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'NubtnList',
  components: {
    Checkbox,
    Options
  },
  data() {
    return {
      btns: [{
        theme: 'primary',
        size: 'sm-center'
      }, {
        theme: 'primary',
        size: 'mid-center'
      }, {
        theme: 'icon_text',
        size: 'sm-center'
      }, {
        theme: 'icon_text',
        size: 'mid-center'
      }, {
        theme: 'edit',
        size: 'mid-center'
      }, {
        theme: 'outline',
        size: 'sm-center'
      }, {
        theme: 'outline',
        size: 'mid-center'
      }, {
        theme: 'text',
        size: 'sm-center'
      }, {
        theme: 'ghost',
        size: 'sm-center'
      }, {
        theme: 'ghost_outline',
        size: 'sm-center'
      }, {
        theme: 'icon',
        size: 'sm-center'
      }, {
        theme: 'icon2',
        size: 'mid-center'
      }, {
        theme: 'danger',
        size: 'sm-center'
      }, {
        theme: 'secondary',
        size: 'sm-center'
      }] as {
        theme: INubtnThemes
        size: INubtnSize
      }[],
      statuses: ['default', 'disabled', 'active'],
      themes: ['primary', 'outline', 'text', 'icon_text', 'icon', 'icon2',
        'ghost', 'ghost_outline', 'danger', 'secondary'],
      full: false,
      darkBG: true,
      btnText: 'Button',
      btnIcon: 'download',
      testBtnStatus: 'default',
      testBtnTheme: 'primary' as INubtnThemes
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
    },
    tableRowsAmount(): number {
      return this.btns.length + 1
    },
    testBtnDisabled(): boolean {
      return this.testBtnStatus === 'disabled'
    },
    testBtnActive: {
      get: function(): boolean { return this.testBtnStatus === 'active' },
      set: function(newVal: boolean) { this.testBtnStatus = newVal ? 'active' : 'default' }
    },
  },
  methods: {
    click() {
      notify({ group: 'copy', text: 'click!' })
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
    grid-template-rows: repeat(v-bind(tableRowsAmount), auto);
    gap: 10px;
    width: fit-content;
  }
}
</style>
