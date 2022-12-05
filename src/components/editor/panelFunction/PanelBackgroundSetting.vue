<template lang="pug">
div(class="bg-setting")
  span(class="bg-setting__title text-blue-1 label-lg") {{$t('NN0142')}}
  div(class="action-bar flex-evenly my-10")
    svg-icon(class="btn-opacity pointer p-5 feature-button"
      iconName="transparency" :iconWidth="'20px'"
      :class="{ 'disabled': backgroundLocked }"
      :iconColor="'gray-2'"
      @click.native="openSliderPopup()"
      v-hint="$t('NN0030')"
    )
    svg-icon(class="pointer p-5 feature-button"
      :class="{ 'active': backgroundLocked }"
      :iconName="backgroundLocked ? 'unlock' : 'lock'"
      :iconWidth="'20px'"
      :iconColor="'gray-2'"
      @click.native="handleLockBackground"
      v-hint="backgroundLocked ? $t('NN0382'): $t('NN0143')"
    )
    svg-icon(class="pointer p-5 feature-button"
      :class="{ 'disabled': backgroundLocked }"
      :iconColor="'gray-2'"
      iconName="trash" :iconWidth="'20px'"
      @click.native="handleDeleteBackground"
      v-hint="$t('NN0034')"
    )
  div(class="mb-10")
    btn(class="full-width"
      :class="backgroundImgControl ? 'active' : ''"
      type="gray-mid"
      :disabled="!isShowImage || backgroundLocked"
      @click.native="() => handleControlBgImage()") {{$t('NN0040')}}
  div(class="bg-setting__grid mb-10")
    btn(class="full-width"
      :class="show === 'popup-flip' ? 'active' : ''"
      type="gray-mid"
      :disabled="!isShowImage || backgroundLocked"
      @click.native="() => handleShow('popup-flip')") {{$t('NN0038')}}
    btn(class="full-width"
      :class="show === 'popup-adjust' ? 'active' : ''"
      type="gray-mid"
      :disabled="!isShowImage || backgroundLocked"
      @click.native="handleShow('popup-adjust')") {{$t('NN0042')}}
  div(class="mb-10 text-left")
    div(v-if="show === 'popup-flip'"
      class="popup-flip"
      v-click-outside="handleOutSide")
      div(v-for="data in popupDatas"
          :key="`popup-${data.icon}`"
          class="popup-flip__item"
          @click="() => handleImageFlip(data.icon)")
        svg-icon(
          class="pointer"
          :iconName="data.icon"
          :iconWidth="'12px'"
          :iconColor="'gray-1'")
        span(class="ml-5 body-2") {{data.text}}
    popup-adjust(v-if="show === 'popup-adjust'"
      :imageAdjust="backgroundAdjust"
      @update="handleChangeBgAdjust"
      v-click-outside="handleOutSide")
  div
    div(class="bg-setting__current-color"
      @click="() => handleColorPicker()"
      :class="colorPickerClass"
      :style="colorPickerStyle")
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import vClickOutside from 'click-outside-vue3'
import { mapGetters, mapMutations } from 'vuex'
import { IPage } from '@/interfaces/page'
import { ColorEventType, PopupSliderEventType } from '@/store/types'
import MappingUtils from '@/utils/mappingUtils'
import popupUtils from '@/utils/popupUtils'
import stepsUtils from '@/utils/stepsUtils'
import colorUtils from '@/utils/colorUtils'
import PopupAdjust from '@/components/popup/PopupAdjust.vue'
import pageUtils from '@/utils/pageUtils'
import backgroundUtils from '@/utils/backgroundUtils'

export default defineComponent({
  components: { PopupAdjust },
  directives: {
    clickOutside: vClickOutside.directive
  },
  data() {
    return {
      show: '',
      popupDatas: [
        { icon: 'flip-h', text: `${this.$t('NN0053')}` },
        { icon: 'flip-v', text: `${this.$t('NN0054')}` }
      ]
    }
  },
  computed: {
    ...mapGetters({
      getPage: 'getPage'
    }),
    currPage(): IPage {
      return this.getPage(pageUtils.currFocusPageIndex)
    },
    backgroundColor(): string {
      return this.currPage.backgroundColor
    },
    backgroundOpacity(): number {
      const { styles: { opacity } } = this.currPage.backgroundImage.config
      return opacity
    },
    backgroundAdjust(): any {
      const { styles: { adjust } } = this.currPage.backgroundImage.config
      return adjust
    },
    backgroundLocked(): boolean {
      const { locked } = this.currPage.backgroundImage.config
      return locked
    },
    backgroundImage(): any {
      return this.currPage.backgroundImage.config?.srcObj ?? {}
    },
    backgroundImgControl(): boolean {
      return this.currPage.backgroundImage.config?.imgControl ?? false
    },
    backgroundImgFlip(): boolean[] {
      const { horizontalFlip = false, verticalFlip = false } = this.currPage.backgroundImage.config?.styles || {}
      return [horizontalFlip, verticalFlip]
    },
    isShowImage(): boolean {
      return this.backgroundImage.assetId
    },
    colorPickerStyle(): any {
      if (this.backgroundColor && !this.backgroundImage.assetId) {
        return { background: this.backgroundColor }
      }
      return {}
    },
    colorPickerClass(): any {
      return {
        'bg-setting__current-color--selected': this.colorPickerStyle.background,
        'bg-setting__current-color--disabled': this.backgroundLocked
      }
    }
  },
  mounted() {
    popupUtils.on(PopupSliderEventType.opacity, this.handleChangeBgOpacity)
    colorUtils.on(ColorEventType.background, this.handleChangeBgColor)
    colorUtils.onStop(ColorEventType.background, this.recordChange)
  },
  beforeUnmount() {
    popupUtils.event.off(PopupSliderEventType.opacity, this.handleChangeBgOpacity)
    colorUtils.event.off(ColorEventType.background, this.handleChangeBgColor)
    colorUtils.offStop(ColorEventType.background, this.recordChange)
  },
  methods: {
    ...mapMutations({
      updateLayerStyles: 'UPDATE_layerStyles',
      setBgColor: 'SET_backgroundColor',
      removeBg: 'REMOVE_background',
      setBgOpacity: 'SET_backgroundOpacity',
      setBgImageControl: 'SET_backgroundImageControl',
      setBgImageStyles: 'SET_backgroundImageStyles'
    }),
    handleDeleteBackground() {
      backgroundUtils.handleDeleteBackground()
    },
    handleLockBackground() {
      backgroundUtils.handleLockBackground()
    },
    handleChangeBgColor(color: string) {
      this.setBgColor({
        pageIndex: pageUtils.currFocusPageIndex,
        color
      })
    },
    handleChangeBgOpacity(opacity: number) {
      this.setBgOpacity({
        pageIndex: pageUtils.currFocusPageIndex,
        // opacity: `${opacity}`
        opacity
      })
    },
    handleControlBgImage() {
      if (this.backgroundLocked) return this.handleLockedNotify()
      this.setBgImageControl({
        pageIndex: pageUtils.currFocusPageIndex,
        imgControl: !this.backgroundImgControl
      })
    },
    handleChangeBgAdjust(adjust: any) {
      this.setBgImageStyles({
        pageIndex: pageUtils.currFocusPageIndex,
        styles: {
          adjust: { ...adjust }
        }
      })
    },
    openSliderPopup() {
      if (this.backgroundLocked) return this.handleLockedNotify()
      const { backgroundOpacity } = this
      popupUtils.setCurrEvent(PopupSliderEventType.opacity)
      popupUtils.setSliderConfig(Object.assign({ value: backgroundOpacity, noText: false }, MappingUtils.mappingMinMax('opacity')))
      popupUtils.openPopup('slider', {
        posX: 'left',
        target: '.btn-opacity'
      })
    },
    openAdjustPopup() {
      if (this.backgroundLocked) return this.handleLockedNotify()
    },
    handleShow(name: string) {
      if (this.backgroundLocked) return this.handleLockedNotify()
      this.show = this.show.includes(name) ? '' : name
    },
    handleColorPicker() {
      if (this.backgroundLocked) return this.handleLockedNotify()
      colorUtils.setCurrEvent(ColorEventType.background)
      colorUtils.setCurrColor(this.backgroundColor)
      this.$emit('toggleColorPanel', true)
    },
    handleImageFlip(flipIcon: string) {
      const [h, v] = this.backgroundImgFlip
      this.setBgImageStyles({
        pageIndex: pageUtils.currFocusPageIndex,
        styles: {
          horizontalFlip: flipIcon === 'flip-h' ? !h : h,
          verticalFlip: flipIcon === 'flip-v' ? !v : v
        }
      })
      stepsUtils.record()
    },
    handleLockedNotify() {
      // this.$notify({ group: 'copy', text: '🔒背景已被鎖定，請解鎖後再進行操作' })
    },
    handleOutSide() {
      this.show = ''
    },
    recordChange() {
      stepsUtils.record()
    }
  }
})
</script>

<style lang="scss" scoped>
.bg-setting {
  &__grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    grid-auto-rows: 1fr;
    row-gap: 10px;
    column-gap: 20px;
  }
  &__current-color {
    width: 40px;
    height: 40px;
    border-radius: 4px;
    cursor: pointer;
    background: center/contain no-repeat
      url("~@/assets/img/png/defaultColor.png");
    &--selected {
      box-shadow: rgb(128 128 128) 0px 0px 0px 2px,
        rgb(255 255 255) 0px 0px 0px 1.5px inset;
    }
    &--disabled {
      opacity: 0.3;
    }
  }
  .btn {
    &.active {
      border: 2px solid setColor(blue-1);
      color: setColor(blue-1);
      padding: 8px 20px;
    }
  }
}

.popup-flip {
  display: inline-block;
  border-radius: 5px;
  box-shadow: 0px 0px 7px rgb(24 25 31 / 25%);
  &__item {
    display: flex;
    align-items: center;
    transition: background-color 0.1s ease-in;
    padding: 0.25rem 0.5rem;
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

.action-bar {
  padding: 10px 15px;
}
</style>
