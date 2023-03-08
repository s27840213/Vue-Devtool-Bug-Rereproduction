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
    })
  },
  methods: {
    ...mapMutations({
      setMyDesignBuffer: 'vivisticker/SET_myDesignBuffer'
    }),
    handleEdit() {
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
    justify-content: start;
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
