<template lang="pug">
  div(class="category-object-item" v-touch)
    div(v-if="item.list" class="category-object-item__4in1" @tap="click4in1")
      img(v-for="img, index in item.list" v-if="index < 4"
        class="category-object-item__img"
        draggable="false" :src="img.src || `https://template.vivipic.com/svg/${img.id}/prev?ver=${img.ver}`")
    template(v-else)
      img(class="category-object-item__img" draggable="false" @tap="clickObject" v-press="addSvg"
        :src="src || `https://template.vivipic.com/svg/${item.id}/prev?ver=${item.ver}`")
      //- pro-item(v-if="item.plan")
      div(v-if="![8, 16].includes(item.type)" class="category-object-item__icon" @click.stop.prevent="handleEditObject")
        svg-icon(iconName="pen" iconColor="white" iconWidth="18px")
      div(v-if="item.type === 16" class="category-object-item__icon" @click.stop.prevent="openGiphyMore")
        svg-icon(iconName="more_vertical" :iconColor="'white'" iconWidth="18px")
</template>

<script lang="ts">
import Vue from 'vue'
import { mapActions, mapMutations } from 'vuex'
import { IGif } from '@/interfaces/giphy'
import ProItem from '@/components/payment/ProItem.vue'
// import paymentUtils from '@/utils/paymentUtils'
import generalUtils from '@/utils/generalUtils'
import vivistickerUtils from '@/utils/vivistickerUtils'
import assetUtils from '@/utils/assetUtils'
import editorUtils from '@/utils/editorUtils'
import doubleTapUtils from '@/utils/doubleTapUtils'

export default Vue.extend({
  components: {
    ProItem
  },
  props: {
    src: String,
    item: Object
  },
  computed: {
    isTouchDevice(): boolean {
      return generalUtils.isTouchDevice()
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
      // if (!paymentUtils.checkPro(this.item, 'pro-object')) return
      if (this.item.type === 8) {
        this.handleEditObject()
      } else if (this.item.type === 16) { // Giphy
        const item = this.item as IGif
        vivistickerUtils.sendToIOS('COPY_IMAGE_FROM_URL', {
          type: 'gif',
          url: item.src.replace('-preview', item.has_d ? '-downsized' : '')
        })
        assetUtils.addAssetToRecentlyUsed(this.item, 'giphy')
      } else {
        vivistickerUtils.sendScreenshotUrl(vivistickerUtils.createUrl(this.item))
        assetUtils.addAssetToRecentlyUsed(this.item, 'objects')
      }
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
      if (this.item.type === 7) {
        vivistickerUtils.startEditing('objectGroup', {
          plan: this.item.plan,
          assetId: this.item.id
        }, vivistickerUtils.getAssetInitiator(this.item, { db: 'svg' }, 'objects'), vivistickerUtils.getAssetCallback(this.item))
      } else {
        vivistickerUtils.startEditing('object', {
          plan: this.item.plan,
          isFrame: this.item.type === 8,
          assetId: this.item.id
        }, vivistickerUtils.getAssetInitiator(this.item, { db: 'svg' }), vivistickerUtils.getAssetCallback(this.item))
      }
    },
    openGiphyMore() {
      this.selectGif(this.item as IGif)
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
