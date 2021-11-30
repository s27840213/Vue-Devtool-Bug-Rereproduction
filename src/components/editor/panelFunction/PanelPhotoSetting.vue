<template lang="pug">
  div(class="photo-setting")
    span(class="photo-setting__title text-blue-1 subtitle-1") 照片設定
    div(class="photo-setting__grid mb-5")
      btn(v-for="btn in btns"
        class="full-width"
        :class="show === btn.show || (btn.name === 'crop' && isCropping) ? 'active' : ''"
        type="gray-mid"
        ref="btn"
        :key="btn.name"
        @click.native="handleShow(btn.show)") {{ btn.label }}
    component(:is="show || 'div'"
      v-click-outside="handleOutside")
    //- property-bar
    //-   input(class="body-2 text-gray-2" max="100" min="0" step="1" v-model="opacity")
    //-   svg-icon(class="pointer"
    //-     :iconName="'transparency'" :iconWidth="'20px'" :iconColor="'gray-2'")
    //- action-bar(class="flex-evenly")
    //-   svg-icon(v-for="(icon,index) in mappingIcons('font')"
    //-     :key="`gp-action-icon-${index}`"
    //-     class="pointer"
    //-     :iconName="icon" :iconWidth="'20px'" :iconColor="'gray-2'")
</template>

<script lang="ts">
import Vue from 'vue'
import { mapGetters, mapMutations } from 'vuex'
import vClickOutside from 'v-click-outside'
import PopupAdjust from '@/components/popup/PopupAdjust.vue'
import layerUtils from '@/utils/layerUtils'
import imageUtils from '@/utils/imageUtils'
import { IFrame } from '@/interfaces/layer'
import frameUtils from '@/utils/frameUtils'

export default Vue.extend({
  data() {
    return {
      show: '',
      btns: [
        { name: 'crop', label: '裁切', show: 'crop' },
        // { name: 'preset', label: '濾鏡', show: '' },
        { name: 'adjust', label: '調整', show: 'popup-adjust' }
        // { name: 'remove-bg', label: '去背', show: '' }
      ]
    }
  },
  directives: {
    clickOutside: vClickOutside.directive
  },
  components: {
    PopupAdjust
  },
  computed: {
    ...mapGetters({
      lastSelectedPageIndex: 'getLastSelectedPageIndex',
      currSelectedInfo: 'getCurrSelectedInfo',
      currSelectedIndex: 'getCurrSelectedIndex',
      getLayer: 'getLayer',
      currSubSelectedInfo: 'getCurrSubSelectedInfo'
    }),
    isCropping(): boolean {
      return imageUtils.isImgControl()
    }
  },
  methods: {
    ...mapMutations({
      updateLayerStyles: 'UPDATE_layerStyles'
    }),
    handleShow(name: string) {
      this.show = this.show.includes(name) ? '' : name
      if (name === 'crop') {
        if (this.isCropping) {
          imageUtils.setImgControlDefault()
        } else {
          let index
          switch (layerUtils.getCurrLayer.type) {
            case 'image':
              layerUtils.updateLayerProps(layerUtils.pageIndex, layerUtils.layerIndex, { imgControl: true })
              break
            case 'frame':
              index = (layerUtils.getCurrLayer as IFrame).clips.findIndex(l => l.type === 'image')
              if (index >= 0) {
                frameUtils.updateFrameLayerProps(layerUtils.pageIndex, layerUtils.layerIndex, index, { imgControl: true })
              }
              break
          }
        }
        this.show = ''
      }
    },
    handleOutside(event: PointerEvent) {
      this.show = ''
      // const target = event.target as HTMLButtonElement
      // const btn = this.$refs.btn as HTMLDivElement
      // if (!btns.contains(target)) {}
    }
  }
})
</script>

<style lang="scss" scoped>
.photo-setting {
  position: relative;
  text-align: center;
  &__grid {
    margin-top: 15px;
    display: grid;
    grid-template-columns: 1fr 1fr;
    grid-auto-rows: 1fr;
    row-gap: 10px;
    column-gap: 20px;
    > button {
      border-radius: 4px;
      &.active {
        border: 2px solid setColor(blue-1);
        color: setColor(blue-1);
        padding: 8px 20px;
      }
    }
  }
}
</style>
