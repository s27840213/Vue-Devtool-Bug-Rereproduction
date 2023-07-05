<template lang="pug">
div(class="panel-my-design-more")
  div(class="panel-my-design-more__options")
    div(class="panel-my-design-more__option"
        @click.prevent.stop="handleEdit")
      div(class="panel-my-design-more__option-icon")
        svg-icon(iconName="pen"
                  iconWidth="18px"
                  iconColor="gray-2")
      div(class="panel-my-design-more__option-title") {{ $t('NN0504') }}
    div(v-if="isTemplate" class="panel-my-design-more__option"
        @click.prevent.stop="handleDuplicate")
      div(class="panel-my-design-more__option-icon")
        svg-icon(iconName="duplicate"
                  iconWidth="18px"
                  iconColor="gray-2")
      div(class="panel-my-design-more__option-title") {{ $t('NN0251') }}
    div(v-if="showDownload" class="panel-my-design-more__option"
        @click.prevent.stop="handleDownload")
      div(class="panel-my-design-more__option-icon")
        svg-icon(iconName="download_flat"
                  iconWidth="18px"
                  iconColor="gray-2")
      div(class="panel-my-design-more__option-title") {{ $t('NN0889') }}
    div(class="panel-my-design-more__option"
        @click.prevent.stop="handleDelete")
      div(class="panel-my-design-more__option-icon")
        svg-icon(iconName="trash"
                  iconWidth="18px"
                  iconColor="gray-2")
      div(class="panel-my-design-more__option-title") {{ $t('NN0034') }}
</template>

<script lang="ts">
import { IPage } from '@/interfaces/page'
import { IMyDesign } from '@/interfaces/vivisticker'
import editorUtils from '@/utils/editorUtils'
import generalUtils from '@/utils/generalUtils'
import modalUtils from '@/utils/modalUtils'
import vivistickerUtils from '@/utils/vivistickerUtils'
import { defineComponent } from 'vue'
import { mapGetters, mapMutations } from 'vuex'

export default defineComponent({
  data() {
    return {
    }
  },
  unmounted() {
    this.setMyDesignBuffer(undefined)
  },
  props: {
  },
  computed: {
    ...mapGetters({
      myDesignBuffer: 'vivisticker/getMyDesignBuffer'
    }) as { myDesignBuffer: () => IMyDesign },
    isTemplate() {
      return vivistickerUtils.mapEditorType2MyDesignKey(this.myDesignBuffer.type) === 'template'
    },
    showDownload() {
      return vivistickerUtils.checkVersion('1.34') && !this.isTemplate
    }
  },
  methods: {
    ...mapMutations({
      setMyDesignBuffer: 'vivisticker/SET_myDesignBuffer',
      addDesign: 'vivisticker/UPDATE_addDesign'
    }),
    handleEdit() {
      if (this.myDesignBuffer.type === 'object' && !vivistickerUtils.checkPro(this.myDesignBuffer.assetInfo, this.myDesignBuffer.assetInfo.isFrame ? 'frame' : 'object')) return
      const mydesign = generalUtils.deepCopy(this.myDesignBuffer)
      editorUtils.setCloseMobilePanelFlag(true)
      setTimeout(() => {
        vivistickerUtils.initWithMyDesign(mydesign, {
          callback: (pages: Array<IPage>) => {
            if (mydesign.assetInfo.isFrame) {
              const page = pages[0]
              page.layers.forEach(l => {
                l.initFromMydesign = true
              })
              vivistickerUtils.initLoadingFlags(page, () => {
                vivistickerUtils.handleFrameClipError(page, true)
              })
            }
          }
        })
      }, 300)
    },
    handleDuplicate() {
      vivistickerUtils.fetchMyDesign(this.myDesignBuffer).then((data) => {
        const json = {
          ...this.myDesignBuffer,
          id: generalUtils.generateAssetId(),
          updateTime: new Date(Date.now()).toISOString()
        }
        vivistickerUtils.addAsset(`mydesign-${vivistickerUtils.mapEditorType2MyDesignKey(this.myDesignBuffer.type)}`, json, 0, {
          config: { pages: data.pages }
        }).then(() => {
          vivistickerUtils.callIOSAsAPI('CLONE_IMAGE', { type: 'mydesign', srcId: this.myDesignBuffer.id, desId: json.id }, `screenshot-mydesign-${this.myDesignBuffer.id}-${json.id}`).then((data) => {
            this.addDesign({
              tab: 'template',
              list: [json]
            })
            editorUtils.setCloseMobilePanelFlag(true)
          })
        })
      })
    },
    handleDownload() {
      vivistickerUtils.fetchMyDesign(this.myDesignBuffer).then(data => {
        if (['object', 'objectGroup'].includes(this.myDesignBuffer.type) && vivistickerUtils.checkForEmptyFrame(data.pages)) {
          editorUtils.setCloseMobilePanelFlag(true)
          // handle Dialog and File-selector
          vivistickerUtils.initWithMyDesign(this.myDesignBuffer, {
            callback: (pages: Array<IPage>) => {
              const page = pages[0]
              page.layers.forEach(l => {
                l.initFromMydesign = true
              })
              vivistickerUtils.initLoadingFlags(page, () => {
                vivistickerUtils.handleFrameClipError(page, true)
              })
            },
            tab: ''
          })
        } else {
          const pages = generalUtils.deepCopy(data.pages)
          vivistickerUtils.sendScreenshotUrl(vivistickerUtils.createUrlForJSON({ page: pages[0], source: 'mydesign', asset: this.myDesignBuffer }), 'download')
        }
      })
    },
    handleDelete() {
      modalUtils.setModalInfo(
        `${this.$t('STK0013')}`,
        [`${this.$t('STK0014')}`],
        {
          msg: `${this.$t('NN0034')}`,
          action: this.confirmDeletion
        },
        {
          msg: `${this.$t('NN0203')}`,
          action: modalUtils.clearModalInfo,
          style: {
            color: '#474A57',
            background: '#D9DBE1'
          }
        }
      )
    },
    confirmDeletion() {
      vivistickerUtils.deleteAsset(`mydesign-${vivistickerUtils.mapEditorType2MyDesignKey(this.myDesignBuffer.type)}`, this.myDesignBuffer.id, 'mydesign')
      editorUtils.setCloseMobilePanelFlag(true)
    }
  }
})
</script>

<style lang="scss" scoped>
.panel-my-design-more {
  padding-bottom: 8px;
  &__options {
    display: flex;
    flex-direction: column;
  }
  &__option {
    height: 40px;
    padding: 0 24px;
    display: flex;
    gap: 16px;
    align-items: center;
    justify-content: flex-start;
    &:not(.version):active {
      background: setColor(black-6);
    }
    &.selected {
      background: setColor(black-6);
    }
  }
  &__option-icon {
    @include size(24px);
    display: flex;
    align-items: center;
    justify-content: center;
  }
  &__option-title {
    @include body-SM;
    color: setColor(gray-2);
    &.version {
      color: setColor(gray-3);
    }
  }
}
</style>
