<template lang="pug">
div(class="popup-updateDesign")
    div(class="popup-updateDesign__wrapper"
      v-click-outside="handleCancel")
      div(class="popup-updateDesign__close")
        svg-icon(class="pointer"
          iconName="page-close"
          iconWidth="15px"
          iconColor="gray-0"
          @click="handleCancel")
      div(class="popup-updateDesign__title") {{ typeText }}資訊
      div(class="popup-updateDesign__line mb-10" style="background: #eee;")
        span(class="body-1") id
        span(class="pl-15 body-2" @click="copyText(focusDesignId)") {{focusDesignId}}
      img(v-if="focusDesignId.length > 0"
        class="popup-updateDesign__image"
        :style="backgroundStyle()"
        :src="`https://template.vivipic.com/${type}/${focusDesignId}/prev?ver=${imgRandQuery}`")
      div(v-if="!isBackgroundType"
        class="popup-updateDesign__checkbox")
        input(type="checkbox" v-model="isGrayBackground")
        span 灰背景
      div(v-if="isGetObjectInfo")
        div(v-if="!isBackgroundType"
          class="popup-updateDesign__line")
          span(class="body-1") 語系
          select(class="popup-updateDesign__select"
            v-model="objectInfo.locale")
            option(v-for="locale in localeOptions"
              :key="locale"
              :value="locale") {{locale}}
        div(class="popup-updateDesign__line") tags_tw
        div
          property-bar
            input(class="body-2 text-gray-2" min="0"
              v-model="objectInfo.tags_tw")
        div(class="popup-updateDesign__line") tags_us
        div
          property-bar
            input(class="body-2 text-gray-2" min="0"
              v-model="objectInfo.tags_us")
        div(class="popup-updateDesign__line") tags_jp
        div
          property-bar
            input(class="body-2 text-gray-2" min="0"
              v-model="objectInfo.tags_jp")
        div(class="popup-updateDesign__line") plan(0：預設一般 / 1：Pro)
        div
          property-bar
            input(class="body-2 text-gray-2" min="0"
              v-model="objectInfo.plan")
        btn(:type="'primary-sm'"
            class="popup-updateDesign__button rounded my-5"
            @click="updateDataClicked()") 更 新
    spinner(v-if="isLoading")
</template>

<script lang="ts">
import designApis from '@/apis/design-info'
import store from '@/store'
import GeneralUtils from '@/utils/generalUtils'
import { notify } from '@kyvg/vue3-notification'
import vClickOutside from 'click-outside-vue3'
import { defineComponent } from 'vue'
import { mapGetters } from 'vuex'

export default defineComponent({
  emits: [],
  directives: {
    clickOutside: vClickOutside.directive
  },
  data() {
    return {
      imgRandQuery: '',
      objectInfo: {
        key_id: '' as string,
        edit_time: '' as string,
        tags_tw: '' as string,
        tags_us: '' as string,
        tags_jp: '' as string,
        locale: '' as string,
        plan: '' as string
      },
      isGrayBackground: false,
      isLoading: false,
      isGetObjectInfo: true,
      localeOptions: ['tw', 'us', 'jp']
    }
  },
  computed: {
    ...mapGetters({
      token: 'user/getToken',
      type: 'user/getUpdateDesignType',
      focusDesignId: 'user/getUpdateDesignId'
    }),
    typeText(): string {
      let titleText = ''
      switch (this.type) {
        case 'svg':
          titleText = '元素'
          break
        case 'text':
          titleText = '文字'
          break
        case 'background':
          titleText = '背景'
          break
      }
      return titleText
    },
    isBackgroundType(): boolean {
      return this.type === 'background'
    }
  },
  async mounted() {
    this.imgRandQuery = GeneralUtils.generateRandomString(5)
    if (this.focusDesignId.length > 0) {
      const data = {}
      const res = await designApis.getDesignInfo(this.token, this.type, this.focusDesignId, 'select', JSON.stringify(data))
      if (res.data.flag === 0) {
        this.isGetObjectInfo = true
        this.objectInfo = res.data.data
        this.objectInfo.edit_time = this.objectInfo.edit_time.replace(/T/, ' ').replace(/\..+/, '')
      } else {
        notify({ group: 'copy', text: `找不到${this.typeText}資料` })
      }
    }
  },
  methods: {
    async updateDataClicked() {
      if (!this.objectInfo.key_id) {
        notify({ group: 'copy', text: `請先取得${this.typeText}資料` })
        return
      }

      this.isLoading = true
      const data = {
        locale: this.objectInfo.locale,
        tags_tw: this.objectInfo.tags_tw,
        tags_us: this.objectInfo.tags_us,
        tags_jp: this.objectInfo.tags_jp,
        plan: this.objectInfo.plan ? this.objectInfo.plan : '0'
      }
      const res = await designApis.updateDesignInfo(this.token, this.type, this.objectInfo.key_id, 'update', JSON.stringify(data))
      if (res.data.flag === 0) {
        notify({ group: 'copy', text: `${this.typeText}資料更新成功` })
        this.objectInfo = res.data.data
        this.objectInfo.edit_time = this.objectInfo.edit_time.replace(/T/, ' ').replace(/\..+/, '')
      } else {
        notify({ group: 'copy', text: '更新時發生錯誤' })
      }
      this.isLoading = false
    },
    backgroundStyle() {
      if (this.isGrayBackground) {
        return {
          background: 'gray'
        }
      } else {
        return {
          background: 'unset'
        }
      }
    },
    copyText(text: string) {
      if (text.length === 0) {
        return
      }
      GeneralUtils.copyText(text)
        .then(() => {
          notify({ group: 'copy', text: `${text} 已複製` })
        })
    },
    handleCancel() {
      const isUpdateDesignOpen = false
      store.commit('user/SET_STATE', { isUpdateDesignOpen })
    }
  }
})
</script>

<style lang="scss" scoped>
.popup-updateDesign {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: rgba(0,0,0,.6313725490196078);
  z-index: 99;
  &__close {
    position: absolute;
    top: 20px;
    right: 20px;
  }
  &__wrapper {
    width: 40vw;
    border-radius: 5px;
    background: #fff;
    padding: 20px 5vw;
    overflow-y: scroll;
    position: relative;
  }
  &__title {
    font-size: 20px;
  }
  &__line {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 5px;
    margin-top: 10px;
  }
  &__image {
    margin: 0 auto;
    max-width: 100px;
    max-height: 100px;
    padding-top: 10px;
    padding-bottom: 10px;
  }
  &__checkbox {
    display: flex;
    flex-direction: row;
    justify-content: flex-end;
    > input {
      width: 25px;
    }
  }
  &__select {
    width: 40%;
    height: 35px;
    font-size: 18px;
    border: 1px solid #d9dbe1;
    padding-left: 15px;
  }
  &__button {
    margin: 0 auto;
    width: 60%;
    font-size: 14px;
    margin-top:15px;
    padding: 12px 0;
  }
}
</style>
