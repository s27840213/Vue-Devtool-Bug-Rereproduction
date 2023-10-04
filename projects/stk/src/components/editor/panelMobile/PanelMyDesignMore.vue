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
    div(class="panel-my-design-more__option"
        @click.prevent.stop="handleReport")
      div(class="panel-my-design-more__option-icon")
        svg-icon(iconName="error"
                  iconWidth="22px"
                  iconColor="gray-2")
      div(class="panel-my-design-more__option-title") {{ $t('STK0088') }}
</template>

<script lang="ts">
import { IPage } from '@nu/vivi-lib/interfaces/page'
import { IMyDesign, ITempDesign } from '@/interfaces/vivisticker'
import editorUtils from '@nu/vivi-lib/utils/editorUtils'
import generalUtils from '@nu/vivi-lib/utils/generalUtils'
import modalUtils from '@nu/vivi-lib/utils/modalUtils'
import uploadUtils from '@nu/vivi-lib/utils/uploadUtils'
import stkWVUtils from '@nu/vivi-lib/utils/stkWVUtils'
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
      return stkWVUtils.mapEditorType2MyDesignKey(this.myDesignBuffer.type) === 'template'
    },
    showDownload() {
      return stkWVUtils.checkVersion('1.34') && !this.isTemplate
    }
  },
  methods: {
    ...mapMutations({
      setMyDesignBuffer: 'vivisticker/SET_myDesignBuffer',
      addDesign: 'vivisticker/UPDATE_addDesign'
    }),
    handleEdit() {
      if (this.myDesignBuffer.type === 'object' && !stkWVUtils.checkPro(this.myDesignBuffer.assetInfo, this.myDesignBuffer.assetInfo.isFrame ? 'frame' : 'object')) return
      const mydesign = generalUtils.deepCopy(this.myDesignBuffer)
      editorUtils.setCloseMobilePanelFlag(true)
      setTimeout(() => {
        stkWVUtils.initWithMyDesign(mydesign, {
          callback: (pages: Array<IPage>) => {
            if (mydesign.assetInfo.isFrame) {
              const page = pages[0]
              page.layers.forEach(l => {
                l.initFromMydesign = true
              })
              stkWVUtils.initLoadingFlags(page, () => {
                stkWVUtils.handleFrameClipError(page, true)
              })
            }
          }
        })
      }, 300)
    },
    handleDuplicate() {
      stkWVUtils.fetchMyDesign(this.myDesignBuffer).then((data) => {
        const json = {
          ...this.myDesignBuffer,
          id: generalUtils.generateAssetId(),
          updateTime: new Date(Date.now()).toISOString()
        }
        stkWVUtils.addAsset(`mydesign-${stkWVUtils.mapEditorType2MyDesignKey(this.myDesignBuffer.type)}`, json, 0, {
          config: { pages: data.pages }
        }).then(() => {
          stkWVUtils.callIOSAsAPI('CLONE_IMAGE', { type: 'mydesign', srcId: this.myDesignBuffer.id, desId: json.id }, `screenshot-mydesign-${this.myDesignBuffer.id}-${json.id}`).then((data) => {
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
      stkWVUtils.fetchMyDesign(this.myDesignBuffer).then(data => {
        if (['object', 'objectGroup'].includes(this.myDesignBuffer.type) && stkWVUtils.checkForEmptyFrame(data.pages)) {
          editorUtils.setCloseMobilePanelFlag(true)
          // handle Dialog and File-selector
          stkWVUtils.initWithMyDesign(this.myDesignBuffer, {
            callback: (pages: Array<IPage>) => {
              const page = pages[0]
              page.layers.forEach(l => {
                l.initFromMydesign = true
              })
              stkWVUtils.initLoadingFlags(page, () => {
                stkWVUtils.handleFrameClipError(page, true)
              })
            },
            tab: ''
          })
        } else {
          const pages = generalUtils.deepCopy(data.pages)
          stkWVUtils.sendScreenshotUrl(stkWVUtils.createUrlForJSON({ page: pages[0], source: 'mydesign', asset: this.myDesignBuffer }), 'download')
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
    async handleReport() {
      stkWVUtils.setLoadingOverlay([this.$t('STK0087')])
      const {
        id,
        type,
        assetInfo
      } = this.myDesignBuffer
      const data = await stkWVUtils.fetchMyDesign(this.myDesignBuffer)
      await uploadUtils.uploadReportedDesign({ id, editorType: type, assetInfo, pages: data.pages } as ITempDesign, { id: this.myDesignBuffer.id })
      stkWVUtils.setLoadingOverlayShow(false)
      modalUtils.setModalInfo(
        `${this.$t('STK0089')}`,
        [`${this.$t('STK0090')}`],
        {
          msg: `${this.$t('STK0019')}`
        }
      )
    },
    confirmDeletion() {
      stkWVUtils.deleteAsset(`mydesign-${stkWVUtils.mapEditorType2MyDesignKey(this.myDesignBuffer.type)}`, this.myDesignBuffer.id, 'mydesign')
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
