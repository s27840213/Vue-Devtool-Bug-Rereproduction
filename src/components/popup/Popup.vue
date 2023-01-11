<template lang="pug">
  div(class="popup bg-white")
    component(:is="component"
    v-click-outside="vcoConfig"
    :updateOptions="sharedUpdateOptions"
    v-bind="props"
    @close="close")
</template>

<script lang="ts">
import Vue from 'vue'
import vClickOutside from 'v-click-outside'
import PopupOrder from '@/components/popup/PopupOrder.vue'
import PopupAlign from '@/components/popup/PopupAlign.vue'
import PopupLayer from '@/components/popup/PopupLayer.vue'
import PopupPage from '@/components/popup/PopupPage.vue'
import PopupFlip from '@/components/popup/PopupFlip.vue'
import PopupFile from '@/components/popup/PopupFile.vue'
import PopupDownload from '@/components/popup/PopupDownload.vue'
import PopupLineTemplate from '@/components/popup/PopupLineTemplate.vue'
import PopupGuideline from '@/components/popup/PopupGuideline.vue'
import PopupSlider from '@/components/popup/PopupSlider.vue'
import PopupPageScale from '@/components/popup/PopupPageScale.vue'
import PopupSubmit from '@/components/popup/PopupSubmit.vue'
import PopupPayment from '@/components/popup/PopupPayment.vue'
import PopupIcon from '@/components/popup/PopupIcon.vue'
import { mapActions, mapGetters, mapState } from 'vuex'
import { IPopupComponent, IPopupOptions } from '@/interfaces/popup'
import popupUtils from '@/utils/popupUtils'
import uploadUtils from '@/utils/uploadUtils'
import pageUtils from '@/utils/pageUtils'
import modalUtils from '@/utils/modalUtils'

export default Vue.extend({
  components: {
    PopupOrder,
    PopupLayer,
    PopupAlign,
    PopupPage,
    PopupFlip,
    PopupSlider,
    PopupFile,
    PopupLineTemplate,
    PopupGuideline,
    PopupDownload,
    PopupPageScale,
    PopupSubmit,
    PopupPayment,
    PopupIcon
  },
  directives: {
    clickOutside: vClickOutside.directive
  },
  data() {
    return {
      vcoConfig: {
        handler: () => {
          popupUtils.closePopup()
        },
        middleware: null as unknown,
        events: ['dblclick', 'click', 'contextmenu']
        // events: ['dblclick', 'click', 'contextmenu', 'mousedown']
      }
    }
  },
  computed: {
    ...mapState('user', [
      'roleRaw'
    ]),
    ...mapGetters({
      popupComponent: 'popup/getPopupComponent',
      getPage: 'getPage',
      currSelectedInfo: 'getCurrSelectedInfo',
      isLogin: 'user/isLogin',
      groupId: 'getGroupId',
      groupType: 'getGroupType',
      isOutsourcer: 'user/isOutsourcer',
      showAdminTool: 'user/showAdminTool'
    }),
    component(): string {
      return (this.popupComponent as IPopupComponent).component
    },
    props(): { [key: string]: string } {
      return (this.popupComponent as IPopupComponent).props
    },
    hasDesignId(): boolean {
      return this.getPage(pageUtils.currFocusPageIndex)?.designId !== ''
    },
    sharedUpdateOptions(): Array<IPopupOptions> {
      return [
        {
          icon: 'copy',
          text: '上傳單頁模板',
          shortcutText: '',
          condition: this.showAdminTool && this.isLogin,
          action: () => {
            uploadUtils.uploadTemplate()
          }
        },
        {
          icon: 'copy',
          text: '更新單頁模板',
          shortcutText: '',
          condition: this.showAdminTool && this.hasDesignId && this.isLogin,
          action: () => {
            uploadUtils.updateTemplate()
          }
        },
        {
          icon: 'copy',
          text: '上傳群組模板',
          shortcutText: '',
          condition: this.showAdminTool && !this.isOutsourcer && this.isLogin && pageUtils.getPages.length > 1,
          action: () => {
            uploadUtils.uploadGroupDesign(0, 0)
          }
        },
        {
          icon: 'copy',
          text: '更新群組模板',
          shortcutText: '',
          condition: this.groupId && this.showAdminTool && !this.isOutsourcer && this.isLogin && this.groupType === 0,
          action: () => {
            uploadUtils.uploadGroupDesign(1, 0)
          }
        },
        {
          icon: 'copy',
          text: '刪除群組模板',
          shortcutText: '',
          condition: this.groupId && this.showAdminTool && !this.isOutsourcer && this.isLogin && this.groupType === 0,
          action: () => {
            modalUtils.setModalInfo(
              '確認刪除群組模板？',
              [],
              {
                msg: '',
                action: () => {
                  uploadUtils.uploadGroupDesign(1, 0, true)
                }
              }
            )
          }
        },
        {
          icon: 'copy',
          text: '上傳詳情頁模板',
          shortcutText: '',
          condition: this.showAdminTool && !this.isOutsourcer && this.isLogin && pageUtils.getPages.length > 1,
          action: () => {
            uploadUtils.uploadGroupDesign(0, 1)
          }
        },
        {
          icon: 'copy',
          text: '更新詳情頁模板',
          shortcutText: '',
          condition: this.groupId && this.showAdminTool && !this.isOutsourcer && this.isLogin && this.groupType === 1,
          action: () => {
            uploadUtils.uploadGroupDesign(1, 1)
          }
        },
        {
          icon: 'copy',
          text: '刪除詳情頁模板',
          shortcutText: '',
          condition: this.groupId && this.showAdminTool && !this.isOutsourcer && this.isLogin && this.groupType === 1,
          action: () => {
            uploadUtils.uploadGroupDesign(1, 1, true)
          }
        },
        {
          icon: 'copy',
          text: '更新群組成詳情頁',
          shortcutText: '',
          condition: this.groupId && this.showAdminTool && !this.isOutsourcer && this.isLogin && this.groupType === 0,
          action: () => {
            uploadUtils.uploadGroupDesign(1, 1)
          }
        },
        {
          icon: 'copy',
          text: '更新詳情頁成群組',
          shortcutText: '',
          condition: this.groupId && this.showAdminTool && !this.isOutsourcer && this.isLogin && this.groupType === 1,
          action: () => {
            uploadUtils.uploadGroupDesign(1, 0)
          }
        }
        // {
        //   icon: 'copy',
        //   text: '測試用',
        //   shortcutText: '',
        //   condition: true,
        //   action: () => {
        //     generalUtils.test()
        //   }
        // }
      ]
    }
  },
  mounted() {
    this.vcoConfig.middleware = this.middleware
  },
  methods: {
    ...mapActions({
      closePopup: 'popup/closePopup'
    }),
    middleware() { // These component controll v-click-o by themself.
      if (['popup-payment', 'popup-icon'].includes(this.component)) return false
      return true
    },
    async close() {
      await (this.popupComponent as IPopupComponent).closeHandler()
      this.closePopup()
    }
  }
})
</script>

<style lang="scss" scoped>
.popup {
  width: initial;
  height: initial;
  border-radius: 5px;
  position: absolute;
  left: 0;
  top: 0;
  z-index: setZindex("popup");
  box-shadow: 0px 0px 7px setColor(gray-1, 0.25);
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

  &__hr {
    margin: 0.375rem 0;
    border: none;
    border-bottom: 1px solid setColor(gray-4);
  }
}
</style>
