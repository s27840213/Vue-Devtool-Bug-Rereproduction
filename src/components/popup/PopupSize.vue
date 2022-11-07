<template lang="pug">
  div(class="popup-size"
    v-click-outside="closePopup")
    div(class="popup-size__close")
      svg-icon(class="pointer"
        iconName="page-close"
        iconWidth="10px"
        iconColor="gray-0"
        @click.native="closePopup()")
    div(class="label-mid pb-20 text-center") {{$t('NN0072')}}
    //- div(class="popup-size__body-row")
    //-   div(class="popup-size__body__custom")
    //-     property-bar(class="popup-size__body__custom__box"
    //-       :class="widthValid ? '' : 'input-invalid'")
    //-       input(id="input-width"
    //-         class="body-3" type="number" min="0"
    //-         :placeholder="isMobile ? $t('NN0320') : $t('NN0163', {term: $t('NN0320')})"
    //-         :class="selectedFormat === 'custom' ? 'text-black' : 'text-gray-3'"
    //-         :value="pageWidth"
    //-         @input="setPageWidth"
    //-         @click="selectFormat('custom')")
    //-       span(class="body-4 text-gray-3") W
    //-     svg-icon(class="pointer px-10"
    //-       :iconName="isLocked ? 'lock' : 'unlock'"
    //-       iconWidth="15px" :iconColor="!isLockDisabled ? 'black' : 'gray-3'"
    //-       @click.native="toggleLock()")
    //-     property-bar(class="popup-size__body__custom__box"
    //-       :class="heightValid ? '' : 'input-invalid'")
    //-       input(id="input-height"
    //-         class="body-3" type="number" min="0"
    //-         :placeholder="isMobile ? $t('NN0319') : $t('NN0163', {term: $t('NN0319')})"
    //-         :class="selectedFormat === 'custom' ? 'text-black' : 'text-gray-3'"
    //-         :value="pageHeight"
    //-         @input="setPageHeight"
    //-         @click="selectFormat('custom')")
    //-       span(class="body-4 text-gray-3") H
    //- div(v-if="!widthValid || !heightValid"
    //-   class="popup-size__body-row text-red body-2") {{errorMsg}}
    //- div(v-if="isLogin && recentlyUsed.length > 0")
    //-   div(class="popup-size__body__hr")
    //-   div(class="label-mid text-left") {{$t('NN0024')}}
    //-   div(v-if="!isLayoutReady"
    //-     class="popup-size__body-row-center")
    //-     svg-icon(iconName="loading"
    //-       iconWidth="25px"
    //-       iconHeight="10px"
    //-       iconColor="gray-0")
    //-   div(v-for="(format, index) in recentlyUsed"
    //-     class="popup-size__body-row pointer"
    //-     @click="selectFormat(`recent-${index}`)")
    //-     radio-btn(class="popup-size__body__radio pr-10"
    //-       circleColor="gray-3"
    //-       :isSelected="selectedFormat === `recent-${index}`",
    //-       :formatKey="`recent-${index}`",
    //-       @select="selectFormat")
    //-     span(class="popup-size__body__recently body-2 pointer"
    //-       :class="selectedFormat === `recent-${index}` ? 'text-black' : 'text-gray-3'"
    //-       @click="selectFormat(`recent-${index}`)") {{ makeFormatString(format) }}
    PageSizeSelector(:isValidate="isConfirmClicked" defaultFormat="custom" ref="pageSizeSelector" @select="selectFormat")
    div(class="popup-size__body__button")
      btn(:type="'primary-sm'"
        class="rounded my-5 full-width pointer"
        @click.native="onConfirmClicked()") {{$tc('NN0164', 2)}}
</template>

<script lang="ts">
import Vue from 'vue'
import { mapActions, mapGetters, mapState } from 'vuex'
import vClickOutside from 'v-click-outside'
import RadioBtn from '@/components/global/RadioBtn.vue'
import { ILayout } from '@/interfaces/layout'
import { IListServiceContentData } from '@/interfaces/api'
import { Itheme } from '@/interfaces/theme'
import designUtils from '@/utils/designUtils'
import PageSizeSelector from '@/components/mydesign/PageSizeSelector.vue'

export default Vue.extend({
  components: {
    RadioBtn,
    PageSizeSelector
  },
  directives: {
    clickOutside: vClickOutside.directive
  },
  data() {
    return {
      recentlyUsed: [] as ILayout[],
      selectedFormat: {} as ILayout,
      pageWidth: '' as string | number,
      pageHeight: '' as string | number,
      errorMsg: '',
      aspectRatio: 1,
      isLayoutReady: false,
      isConfirmClicked: false,
      isLocked: false
    }
  },
  computed: {
    ...mapState('design', [
      'currLocation',
      'currFolderInfo'
    ]),
    isMobile(): boolean {
      return document.body.clientWidth / document.body.clientHeight < 1
    }
    // widthValid(): boolean {
    //   if (!this.isConfirmClicked || this.selectedFormat !== 'custom') {
    //     return true
    //   } else if (this.pageWidth === '0' || this.pageWidth === '') {
    //     return false
    //   } else {
    //     return true
    //   }
    // },
    // heightValid(): boolean {
    //   if (!this.isConfirmClicked || this.selectedFormat !== 'custom') {
    //     return true
    //   } else if (this.pageHeight === '0' || this.pageHeight === '') {
    //     return false
    //   } else {
    //     return true
    //   }
    // },
    // isLockDisabled() {
    //   if (this.selectedFormat === 'custom' && this.pageWidth > 0 && this.pageHeight > 0) {
    //     return false
    //   } else {
    //     return true
    //   }
    // }
  },
  mounted() {
    // this.fetchLayouts()
    // const inputWidth = document.getElementById('input-width') as HTMLElement
    // inputWidth.focus()
  },
  methods: {
    // ...mapGetters({
    //   isLogin: 'user/isLogin'
    // }),
    // ...mapActions('layouts', [
    //   'getRecently'
    // ]),
    // toggleLock() {
    //   if (this.isLockDisabled) {
    //     return
    //   }
    //   this.isLocked = !this.isLocked
    //   if (this.isLocked) {
    //     this.aspectRatio = (this.pageWidth as number) / (this.pageHeight as number)
    //   }
    // },
    // makeFormatString(format: ILayout) {
    //   if (format.id !== '') {
    //     return `${format.title} ${format.description}`
    //   } else {
    //     return `${format.width} x ${format.height}`
    //   }
    // },
    // setPageWidth(event: Event) {
    //   const value = (event.target as HTMLInputElement).value
    //   this.pageWidth = parseInt(value)
    //   this.selectedFormat = 'custom'
    //   if (this.isLocked) {
    //     if (value === '') {
    //       this.pageHeight = ''
    //     } else {
    //       this.pageHeight = Math.round(parseInt(value) / this.aspectRatio)
    //     }
    //   }
    // },
    // setPageHeight(event: Event) {
    //   const value = (event.target as HTMLInputElement).value
    //   this.pageHeight = parseInt(value)
    //   this.selectedFormat = 'custom'
    //   if (this.isLocked) {
    //     if (value === '') {
    //       this.pageWidth = ''
    //     } else {
    //       this.pageWidth = Math.round(parseInt(value) * this.aspectRatio)
    //     }
    //   }
    // },
    selectFormat(layout: ILayout) {
      this.selectedFormat = layout
    },
    // fetchLayouts() {
    //   this.isLayoutReady = false
    //   this.recentlyUsed = []
    //   this.getRecently().then(() => {
    //     for (const category of this.categories as IListServiceContentData[]) {
    //       if (category.title === `${this.$t('NN0024')}`) {
    //         this.recentlyUsed = category.list.map(item => ({
    //           id: item.id,
    //           width: item.width ?? 0,
    //           height: item.height ?? 0,
    //           title: item.title ?? '',
    //           description: item.description ?? ''
    //         }))
    //       }
    //     }
    //     if (this.isLogin() && this.recentlyUsed.length > 0) {
    //       this.selectedFormat = 'recent-0'
    //     } else {
    //       this.selectedFormat = 'custom'
    //       this.pageWidth = '1080'
    //       this.pageHeight = '1080'
    //     }
    //     this.isLayoutReady = true
    //   })
    // },
    closePopup() {
      this.$emit('close')
    },
    onConfirmClicked() {
      this.isConfirmClicked = true
      if (!(this.$refs.pageSizeSelector as any).isFormatApplicable) return // TODO: disable submit button
      designUtils.newDesignWithLoginRedirect(this.selectedFormat.width, this.selectedFormat.height, undefined, this.currLocation.split('/').slice(1).join(','), this.currFolderInfo?.name)
      // if (this.selectedFormat === 'custom' && (!this.widthValid || !this.heightValid)) {
      //   this.errorMsg = '請輸入大於 0 的數字'
      //   return
      // }

      // if (this.selectedFormat === 'custom') {
      //   const item = {
      //     width: (typeof this.pageWidth === 'string') ? parseInt(this.pageWidth) : this.pageWidth,
      //     height: (typeof this.pageHeight === 'string') ? parseInt(this.pageHeight) : this.pageHeight
      //   } as Itheme
      //   this.newDesign(item)
      // } else {
      //   const idx = this.selectedFormat.substr(7)
      //   const item = {
      //     width: this.recentlyUsed[parseInt(idx)].width,
      //     height: this.recentlyUsed[parseInt(idx)].height
      //   } as Itheme
      //   this.newDesign(item)
      // }
    }
    // newDesign(item: Itheme) {
    //   designUtils.newDesignWithLoginRedirect(item.width, item.height)
    // }
  }
})
</script>

<style lang="scss" scoped>
.popup-size {
  position: relative;
  width: 500px;
  display: grid;
  grid-template-columns: 1fr;
  box-sizing: border-box;
  border-radius: 5px;
  box-shadow: 0px 4px 13px rgba(0, 0, 0, 0.25);
  background-color: setColor(white);
  padding: 20px 50px;
  &__body {
    &-row {
      display: flex;
      justify-content: start;
      width: 87%;
      margin-left: auto;
      margin-top: 15px;
      margin-right: 10px;
      align-items: center;
      &-center {
        margin-top: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
    }
    &__custom {
      display: grid;
      grid-template-columns: 1fr auto 1fr;
      grid-template-rows: auto;
      column-gap: 5px;
      row-gap: 5px;
      align-items: center;
      width: 85%;
      &__box {
        height: 26px;
        box-sizing: border-box;
        padding: 5px 5px;
        & input {
          line-height: 16px;
          background-color: transparent;
        }
      }
    }
    &__hr {
      width: 100%;
      height: 1px;
      background: setColor(gray-4);
      margin-left: auto;
      margin-right: auto;
      margin-top: 20px;
      margin-bottom: 20px;
      padding: 0;
    }
    &__button {
      margin: 0 auto;
      width: 60%;
      padding-top: 30px;
    }
  }
  &__close {
    position: absolute;
    top: 20px;
    right: 20px;
  }
}
// .input-invalid {
//   border: 1px solid setColor(red) !important;
// }
</style>
