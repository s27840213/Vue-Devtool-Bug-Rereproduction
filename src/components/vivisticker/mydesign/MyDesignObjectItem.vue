<template lang="pug">
  div(class="my-design-object-item"
      @click="copySvg"
      v-press="copySvg")
    img(class="my-design-object-item__img"
      draggable="false"
      :src="src")
    //- pro-item(v-if="item.assetInfo.plan")
    div(v-if="isInSelectionMode"
        class="my-design-object-item__checkbox"
        :class="{checked: checkSelected()}"
        @click.prevent.stop="handleToggleDesignSelected")
      svg-icon(v-if="checkSelected()" iconName="check" iconColor="white" iconWidth="20.7px")
    div(v-else class="my-design-object-item__more" @click.stop.prevent="handleMoreActions")
      svg-icon(iconName="more" iconColor="white" iconWidth="24px")
</template>

<script lang="ts">
import Vue from 'vue'
import ProItem from '@/components/payment/ProItem.vue'
import vivistickerUtils from '@/utils/vivistickerUtils'
import { mapGetters, mapMutations } from 'vuex'
import editorUtils from '@/utils/editorUtils'
import generalUtils from '@/utils/generalUtils'
import { IPage } from '@/interfaces/page'
import { IFrame, IGroup, ILayer } from '@/interfaces/layer'
import i18n from '@/i18n'
import frameUtils from '@/utils/frameUtils'
import modalUtils from '@/utils/modalUtils'
import { LayerType } from '@/store/types'

export default Vue.extend({
  components: {
    ProItem
  },
  props: {
    item: Object
  },
  computed: {
    ...mapGetters({
      isInSelectionMode: 'vivisticker/getIsInSelectionMode',
      selectedDesigns: 'vivisticker/getSelectedDesigns'
    }),
    src(): string {
      return vivistickerUtils.getThumbSrc('mydesign', this.item.id, this.item.ver)
    }
  },
  methods: {
    ...mapMutations({
      setMyDesignBuffer: 'vivisticker/SET_myDesignBuffer',
      selectDesign: 'vivisticker/UPDATE_selectDesign',
      deselectDesign: 'vivisticker/UPDATE_deselectDesign'
    }),
    checkSelected() {
      return this.selectedDesigns[this.item.id] !== undefined
    },
    copySvg() {
      if (this.isInSelectionMode) {
        this.handleToggleDesignSelected()
        return
      }
      if (this.item.assetInfo.isFrame) {
        vivistickerUtils.getAsset(`mydesign-${vivistickerUtils.mapEditorType2MyDesignKey(this.item.type)}`, this.item.id, 'config').then(data => {
          if (vivistickerUtils.checkForEmptyFrame(data.pages)) {
            // handle Dialog and File-selector
            vivistickerUtils.initWithMyDesign(this.item, {
              callback: (pages: Array<IPage>) => {
                const page = pages[0]
                page.layers.forEach(l => {
                  l.initFromMydesign = true
                })
                vivistickerUtils.initLoadingFlags(page, () => {
                  const { layers } = page
                  const frames = (layers
                    .flatMap((l: ILayer) => {
                      if (l.type === 'frame') {
                        return [l]
                      } else if (l.type === 'group') {
                        const frames = (l as any).layers
                          .filter((l: ILayer) => l.type === 'frame') as Array<IFrame>
                        return frames
                      }
                      return []
                    }) as Array<IFrame>)
                  console.log('init loading flag', frames)
                  // .filter((l: ILayer) => l.type === 'frame') as Array<IFrame>)
                  const missingClips = frames
                    .flatMap((f: IFrame) => f.clips.filter(c => c.srcObj.type === 'frame'))
                  if (missingClips.length === 1) {
                    const modalBtn = {
                      msg: i18n.t('STK0023') as string,
                      action: () => {
                        let subLayerIdx = -1
                        let layerIndex = -1
                        const frame = layers
                          .find((l, i) => {
                            if (l.type === LayerType.frame && (l as IFrame).clips.some((c, i) => {
                              if (c.srcObj.type === 'frame') {
                                subLayerIdx = i
                                return true
                              }
                              return false
                            })) {
                              layerIndex = i
                              return true
                            }
                            return false
                          }) as IFrame
                        frameUtils.iosPhotoSelect({
                          pageIndex: 0,
                          layerIndex,
                          subLayerIdx
                        }, frame.clips[subLayerIdx])
                      }
                    }
                    modalUtils.setModalInfo(i18n.t('STK0024') as string, i18n.t('STK0022') as string, modalBtn)
                  }
                })
              },
              tab: ''
            })
          } else {
            const pages = generalUtils.deepCopy(data.pages)
            vivistickerUtils.sendScreenshotUrl(vivistickerUtils.createUrlForJSON(pages[0], this.item))
          }
        })
      } else {
        vivistickerUtils.getAsset(`mydesign-${vivistickerUtils.mapEditorType2MyDesignKey(this.item.type)}`, this.item.id, 'config').then(data => {
          const pages = generalUtils.deepCopy(data.pages)
          vivistickerUtils.sendScreenshotUrl(vivistickerUtils.createUrlForJSON(pages[0]))
        })
      }
    },
    handleMoreActions() {
      this.setMyDesignBuffer(this.item)
      editorUtils.setCurrActivePanel('my-design-more')
      editorUtils.setShowMobilePanel(true)
    },
    handleToggleDesignSelected() {
      if (this.checkSelected()) {
        this.deselectDesign(this.item)
      } else {
        this.selectDesign(this.item)
      }
    }
  }
})
</script>

<style lang="scss" scoped>
.my-design-object-item {
  position: relative;
  &__img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    vertical-align: middle;
    -webkit-touch-callout: none;
    user-select: none;
  }
  &__checkbox {
    @include size(20px);
    position: absolute;
    top: 4px;
    right: 4px;
    background: setColor(gray-6);
    border: 1px solid setColor(black-5);
    border-radius: 50%;
    box-sizing: border-box;
    display: flex;
    justify-content: center;
    align-items: center;
    &.checked {
      background: setColor(black-3);
      border: none;
    }
  }
  &__more {
    @include size(24px);
    display: flex;
    align-items: center;
    justify-content: center;
    position: absolute;
    right: 2px;
    bottom: 2px;
    border-radius: 5px;
    background: rgba(24, 25, 31, 0.3);
    &:active {
      background: rgba(24, 25, 31, 0.6);
    }
    & > svg {
      opacity: 0.5;
    }
  }
}
</style>
