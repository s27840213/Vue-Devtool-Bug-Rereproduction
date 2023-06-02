<template lang="pug">
div(class="category-object-item" v-touch)
  div(v-if="(item as any).list" class="category-object-item__4in1" @tap="click4in1")
    template(v-for="img, index in (item as any).list" :key="img.id")
      img(v-if="index < 4" class="category-object-item__img"
        draggable="false" :src="img.src || `https://template.vivipic.com/svg/${img.id}/prev?ver=${img.ver}`")
  template(v-else)
    img(class="category-object-item__img" draggable="false" @tap="clickObject" v-press="addSvg"
      :src="src || `https://template.vivipic.com/svg/${item.id}/prev?ver=${item.ver}`")
    pro-item(v-if="item.plan" draggable="false")
    div(v-if="showEditor" class="category-object-item__icon" @click.stop.prevent="handleEditObject")
      svg-icon(iconName="pen" iconColor="white" iconWidth="18px")
    div(v-if="item.type === 16" class="category-object-item__icon" @click.stop.prevent="openGiphyMore")
      svg-icon(iconName="more_vertical" :iconColor="'white'" iconWidth="18px")
</template>

<script lang="ts">
import ProItem from '@/components/payment/ProItem.vue'
import { IGif } from '@/interfaces/giphy'
import { IAsset } from '@/interfaces/module'
import assetUtils from '@/utils/assetUtils'
import doubleTapUtils from '@/utils/doubleTapUtils'
import editorUtils from '@/utils/editorUtils'
import vivistickerUtils from '@/utils/vivistickerUtils'
import { defineComponent, PropType } from 'vue'
import { mapActions, mapMutations } from 'vuex'

export default defineComponent({
  emits: ['dbclick4in1', 'click4in1', 'dbclick'],
  components: {
    ProItem
  },
  props: {
    src: {
      type: String
    },
    item: {
      type: Object as PropType<IAsset>,
      required: true
    },
    isHideEditor: {
      type: Boolean,
      default: false
    }
  },
  computed: {
    showEditor(): boolean {
      return !this.isHideEditor && ![8, 16].includes(this.item.type) && !this.item.has_frame
    }
  },
  methods: {
    ...mapActions('giphy', {
      selectGif: 'selectGif'
    }),
    ...mapMutations({
      setCurrActivePanel: 'mobileEditor/SET_currActivePanel'
    }),
    addSvg() {
      // if (!paymentUtils.checkPro(this.item as {plan: number}, 'pro-object')) return
      // console.log(generalUtils.deepCopy(this.item))
      if (this.item.type === 8 || this.item.has_frame) {
        if (!vivistickerUtils.checkPro(this.item, 'frame')) return
        this.handleEditObject()
        return
      }
      if (this.item.type === 16) { // Giphy
        const item = this.item as any as IGif
        vivistickerUtils.sendToIOS('COPY_IMAGE_FROM_URL', {
          type: 'gif',
          url: item.src.replace('-preview', item.has_d ? '-downsized' : '')
        })
        assetUtils.addAssetToRecentlyUsed(this.item, 'giphy')
        vivistickerUtils.handleIos16Video()
      } else {
        if (!vivistickerUtils.checkPro(this.item, 'object')) return
        vivistickerUtils.sendScreenshotUrl(vivistickerUtils.createUrl(this.item))
        assetUtils.addAssetToRecentlyUsed(this.item, 'objects', 'svg')
        vivistickerUtils.handleIos16Video()
      }
      if (this.isHideEditor) this.handleEditObject()
    },
    click4in1(event: Event) {
      doubleTapUtils.click(event, {
        doubleClickCallback: () => { this.$emit('dbclick4in1', this.item) },
        clickCallback: () => { this.$emit('click4in1', this.item) }
      })
    },
    clickObject(event: Event) {
      doubleTapUtils.click(event, {
        doubleClickCallback: () => { this.$emit('dbclick', this.item) },
        clickCallback: this.addSvg
      })
    },
    handleEditObject() {
      if (!vivistickerUtils.checkPro(this.item, 'object')) return
      if (this.item.type === 7 || this.item.has_frame) {
        vivistickerUtils.startEditing('objectGroup', {
          plan: this.item.plan,
          assetId: this.item.id,
          isFrame: this.item.has_frame,
          fit: this.item.fit ?? 0,
        }, vivistickerUtils.getAssetInitiator(this.item, { db: 'svg', has_frame: this.item.has_frame }, 'objects'), vivistickerUtils.getAssetCallback(this.item))
      } else {
        vivistickerUtils.startEditing('object', {
          plan: this.item.plan,
          isFrame: this.item.type === 8,
          assetId: this.item.id,
          fit: this.item.fit ?? 0,
        }, vivistickerUtils.getAssetInitiator(this.item, { db: 'svg' }), vivistickerUtils.getAssetCallback(this.item))
      }
    },
    openGiphyMore() {
      this.selectGif(this.item as any as IGif)
      this.setCurrActivePanel('giphy-more')
      editorUtils.setShowMobilePanel(true)
    }
  }
})
</script>

<style lang="scss" scoped>
.category-object-item {
  position: relative;
  &__4in1 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    grid-template-rows: repeat(2, calc(50% - 3px));
    gap: 6px;
    box-sizing: border-box;
    height: 100%;
    padding: 7px;
    background-color: setColor(black-3);
    border-radius: 5px;
  }
  &__img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    vertical-align: middle;
    -webkit-touch-callout: none;
    user-select: none;
  }
  &__icon {
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
