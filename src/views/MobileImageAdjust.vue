<template lang="pug">
div(class="mobile-image-adjust")
  div(class="page relative")
    nu-layer(class="nu-layer--p0"
      :data-lindex="0"
      :data-pindex="0"
      :layerIndex="0"
      :pageIndex="0"
      :config="config")
  div(class="photo-setting")
    span(class="photo-setting__title text-blue-1 subtitle-1") {{$t('NN0039')}}
    popup-adjust(
      :imageAdjust="currLayerAdjust"
      @update="handleAdjust")
    div(class="label") 縮放
      input(class="range-input input__slider--range"
        :value="currentScale"
        :max="100"
        :min="1"
        name="scale"
        @input="handleScaling"
        type="range")
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { mapActions, mapGetters, mapMutations, mapState } from 'vuex'
import vClickOutside from 'click-outside-vue3'
import PopupAdjust from '@/components/popup/PopupAdjust.vue'
import layerUtils from '@/utils/layerUtils'
import imageUtils from '@/utils/imageUtils'
import { IFrame, IImage } from '@/interfaces/layer'
import frameUtils from '@/utils/frameUtils'
import imageAdjustUtil from '@/utils/imageAdjustUtil'
import pageUtils from '@/utils/pageUtils'
import { ICurrSelectedInfo } from '@/interfaces/editor'
import uploadUtils from '@/utils/uploadUtils'
import PanelPhotoShadow from '@/components/editor/panelFunction/PanelPhotoShadow.vue'
import groupUtils from '@/utils/groupUtils'
import controlUtils from '@/utils/controlUtils'

export default defineComponent({
  emits: [],
  name: 'MobileImageAdjust',
  directives: {
    clickOutside: vClickOutside.directive
  },
  data() {
    return {
      show: '',
      btns: [
        // { name: 'crop', label: `${this.$t('NN0040')}`, show: 'crop' },
        // { name: 'preset', label: `${this.$t('NN0041')}`, show: '' },
        { name: 'sliders', label: `${this.$t('NN0042')}`, show: 'popup-adjust' }
        // { name: 'shadow', label: `${this.$t('NN0429')}`, show: 'panel-photo-shadow' }
      ],
      bgRemoveBtn: { label: `${this.$t('NN0043')}`, show: 'remove-bg' }
    }
  },
  components: {
    PopupAdjust,
    PanelPhotoShadow
  },
  created() {
    pageUtils.setPages([
      {
        width: 1080,
        height: 1080,
        backgroundColor: '#ffffff',
        backgroundImage: {
          config: {
            type: 'image',
            clipPath: '',
            active: false,
            shown: false,
            locked: false,
            moved: false,
            imgControl: false,
            isClipper: false,
            dragging: false,
            designId: '',
            styles: {
              x: 0,
              y: 0,
              scale: 1,
              scaleX: 0,
              scaleY: 0,
              rotate: 0,
              width: 0,
              height: 0,
              initWidth: 0,
              initHeight: 0,
              imgX: 0,
              imgY: 0,
              imgWidth: 0,
              imgHeight: 0,
              zindex: -1,
              opacity: 100
            },
            srcObj: {
              type: '',
              userId: '',
              assetId: ''
            }
          },
          posX: -1,
          posY: -1,
          id: '5owgZbLn'
        },
        name: '',
        layers: [
          {
            type: 'image',
            srcObj: {
              type: 'unsplash',
              userId: '',
              assetId: 'photo-1492724724894-7464c27d0ceb'
            },
            id: 'S7ZeS32j',
            clipPath: 'M0,0h864v648h-864z',
            active: false,
            shown: false,
            locked: false,
            moved: true,
            imgControl: false,
            inProcess: false,
            trace: 0,
            isClipper: true,
            dragging: false,
            designId: '',
            styles: {
              x: 0,
              y: 0,
              scale: 0.3583197167755996,
              scaleX: 1,
              scaleY: 1,
              rotate: 0,
              width: 309.58823529411757,
              height: 232.19117647058818,
              initWidth: 864,
              initHeight: 648,
              imgX: 0,
              imgY: 0,
              imgWidth: 309.5882352941179,
              imgHeight: 232.19117647058843,
              zindex: 1,
              opacity: 100,
              horizontalFlip: false,
              verticalFlip: false,
              adjust: {},
              shadow: {
                currentEffect: 'none',
                effects: {}
              }
            },
            contentEditable: false,
            editing: true
          }
        ],
        documentColors: [
          '#006977',
          '#C9CACA',
          '#828282',
          '#000000'
        ],
        designId: '',
        guidelines: {
          v: [],
          h: []
        },
        isAutoResizeNeeded: true,
        appVer_origin: '2022-03-14T07:32:21.887Z',
        jsonVer_origin: '1.0.7',
        appVer: '2022-03-14T08:16:39.426Z',
        jsonVer: '1.0.7'
      }
    ])
  },
  mounted() {
    groupUtils.select(0, [0])
  },
  computed: {
    ...mapGetters({
      currSelectedInfo: 'getCurrSelectedInfo',
      currSelectedIndex: 'getCurrSelectedIndex',
      getLayer: 'getLayer',
      currSubSelectedInfo: 'getCurrSubSelectedInfo',
      currSelectedLayers: 'getCurrSelectedLayers',
      inBgRemoveMode: 'bgRemove/getInBgRemoveMode'
    }),
    isCropping(): boolean {
      return imageUtils.isImgControl()
    },
    isFrame(): boolean {
      const { layers, types } = this.currSelectedInfo as ICurrSelectedInfo
      return types.has('frame') && layers.length === 1
    },
    isImage(): boolean {
      const { layers, types } = this.currSelectedInfo as ICurrSelectedInfo
      return types.has('image') && layers.length === 1
    },
    config(): IImage {
      return layerUtils.getLayer(0, 0) as IImage
    },
    currentScale(): number {
      const scale = this.config.styles.scale
      return Math.round(scale / 0.3583197167755996 * 50)
    },
    currLayer(): any {
      const layers = this.currSelectedLayers as any[]
      const { index, type } = this.currSubSelectedInfo
      const imageLayers = layers.flatMap(layer => {
        if (layer.type === 'image') return layer
        if (layer.type === 'frame') {
          const frame = layer as IFrame
          return frame.clips[Math.max(0, index)]
        }
        if (layer.type === 'group') {
          if (type === 'image') return layer.layers[index]
          if (type === 'frame') {
            const frameLayer = (layer.layers as IFrame[])[index]
            return frameLayer.active ? frameLayer.clips[0] : null
          }
          // if no subSelectedLayer, it must be a group of all image layers
          if (layer.layers[0].type === 'image') {
            return layer.layers[0]
          }
        }
        return null
      })
      return { ...imageLayers.find(layer => !!layer) }
    },
    currLayerAdjust(): any {
      return this.currLayer.styles?.adjust ?? {}
    },
    selectedLayersNum(): number {
      return this.currSelectedInfo.layers.length
    }
  },
  methods: {
    ...mapMutations({
      updateLayerStyles: 'UPDATE_layerStyles',
      setInBgRemoveMode: 'bgRemove/SET_inBgRemoveMode',
      setAutoRemoveResult: 'bgRemove/SET_autoRemoveResult',
      setPrevScrollPos: 'bgRemove/SET_prevScrollPos'
    }),
    ...mapActions({
      removeBg: 'user/removeBg'
    }),
    activeBtn(btn: { [key: string]: string }): boolean {
      if (this.show === btn.show) return true
      if (btn.name === 'crop' && this.isCropping) return true
      if (btn.name === 'remove-bg' && this.inBgRemoveMode) return true
      return false
    },
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
      } else if (name === 'remove-bg') {
        const { layers, pageIndex, index } = this.currSelectedInfo as ICurrSelectedInfo

        layerUtils.updateLayerProps(pageIndex, index, {
          inProcess: true
        })

        const targetLayer = layers[0] as IImage
        const type = targetLayer.srcObj.type

        const { imgWidth, imgHeight } = targetLayer.styles
        const aspect = imgWidth >= imgHeight ? 0 : 1
        const isThirdPartyImage = type === 'unsplash' || type === 'pexels'
        const initSrc = imageUtils.getSrc((this.currSelectedInfo as ICurrSelectedInfo).layers[0] as IImage, 'larg')
        this.removeBg({ srcObj: targetLayer.srcObj, ...(isThirdPartyImage && { aspect }) }).then((data) => {
          if (data.flag === 0) {
            uploadUtils.polling(data.url, (json: any) => {
              if (json.flag === 0 && json.data) {
                layerUtils.updateLayerProps(pageIndex, index, {
                  inProcess: false
                })
                const editorView = document.querySelector('.editor-view')
                const { scrollTop, scrollLeft } = editorView as HTMLElement

                this.setPrevScrollPos({
                  top: scrollTop,
                  left: scrollLeft
                })

                this.setAutoRemoveResult(imageUtils.getBgRemoveInfo(json.data, initSrc))
                this.setInBgRemoveMode(true)
                return true
              }
              if (json.flag === 1) {
                return true
              }

              return false
            })
          }
        })
        this.show = ''
      }
    },
    handleOutside(event: PointerEvent) {
      this.show = ''
      // const target = event.target as HTMLButtonElement
      // const btn = this.$refs.btn as HTMLDivElement
      // if (!btns.contains(target)) {}
    },
    handleAdjust(adjust: any) {
      const { types } = this.currSelectedInfo
      const { index, type } = this.currSubSelectedInfo
      if (types.has('frame') || (types.has('group') && type === 'frame')) {
        if (types.has('frame')) {
          if (index >= 0) {
            console.log(index)
            // case 1: one clip in one frame layer, index = clip index
            return frameUtils.updateFrameLayerStyles(
              pageUtils.currFocusPageIndex,
              this.currSelectedIndex,
              index,
              { adjust: { ...adjust } }
            )
          } else {
            // case 2: one frame layer w/o selected clip, index = -1
            return frameUtils.updateFrameLayerAllClipsStyles(
              pageUtils.currFocusPageIndex,
              this.currSelectedIndex,
              { adjust: { ...adjust } }
            )
          }
        }
        // case 3: one frame in a group layer, index = frame index in the group
        return frameUtils.updateSubFrameLayerAllClipsStyles(
          pageUtils.currFocusPageIndex,
          this.currSelectedIndex,
          index,
          { adjust: { ...adjust } }
        )
      }
      if (types.has('image') || types.has('group')) {
        // case 4: one image layer, layerIndex = image layer index, subLayerIndex = undefined
        // case 5: multiple image layers, layerIndex = tmp layer index, subLayerIndex = undefined
        // case 6: one image in a group layer, layerIndex = group layer index, subLayerIndex = sublayer index
        // case 7: whole group of images, layerIndex = group layer index, subLayerIndex = undefined
        return imageAdjustUtil.setAdjust({
          adjust: { ...adjust },
          pageIndex: pageUtils.currFocusPageIndex,
          layerIndex: this.currSelectedIndex,
          subLayerIndex: index >= 0 ? index : undefined
        })
      }
    },
    handleScaling(e: InputEvent) {
      const targetScale = parseInt((e.target as HTMLInputElement).value) / 50 * 0.3583197167755996
      const targetWidth = this.config.styles.initWidth * targetScale
      const targetHeight = this.config.styles.initHeight * targetScale
      controlUtils.updateImgSize(0, 0, targetWidth, targetHeight)
      controlUtils.updateLayerSize(0, 0, targetWidth, targetHeight, targetScale)
    }
  }
})
</script>

<style lang="scss" scoped>
.mobile-image-adjust {
  @include size(100%, 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  > .page {
    width: 100%;
    height: 300px;
  }
}

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
      &.displayNone {
        display: none;
      }
    }
  }
}

.label {
  flex: 1;
  font-size: 14px;
  text-align: left;
  color: setColor(gray-2);
}

.range-input {
  width: 100%;
  height: 20px;
  margin: 0;
  &::-webkit-slider-thumb {
    border: 2px solid #4eabe6;
  }
}
</style>
