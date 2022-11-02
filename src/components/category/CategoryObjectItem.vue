<template lang="pug">
  div(class="category-object-item"
      @click="addSvg"
      v-press="addSvg")
    img(class="category-object-item__img"
      draggable="false"
      :src="src || `https://template.vivipic.com/svg/${item.id}/prev?ver=${item.ver}`")
    //- pro-item(v-if="item.plan")
    div(v-if="item.type !== 8" class="category-object-item__edit" @click.stop.prevent="handleEditObject")
      svg-icon(iconName="pen" iconColor="white" iconWidth="18px")
</template>

<script lang="ts">
import Vue from 'vue'
import ProItem from '@/components/payment/ProItem.vue'
import paymentUtils from '@/utils/paymentUtils'
import generalUtils from '@/utils/generalUtils'
import vivistickerUtils from '@/utils/vivistickerUtils'
import assetUtils from '@/utils/assetUtils'

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
    addSvg() {
      // if (!paymentUtils.checkPro(this.item, 'pro-object')) return
      if (this.item.type === 8) {
        this.handleEditObject()
      } else {
        vivistickerUtils.sendScreenshotUrl(vivistickerUtils.createUrl(this.item))
        assetUtils.addAssetToRecentlyUsed(this.item, 'objects')
      }
    },
    handleEditObject() {
      vivistickerUtils.startEditing('object', vivistickerUtils.getAssetInitiator(this.item, { db: 'svg' }), vivistickerUtils.getAssetCallback(this.item))
    }
  }
})
</script>

<style lang="scss" scoped>
.category-object-item {
  position: relative;
  &__img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    vertical-align: middle;
    -webkit-touch-callout: none;
    user-select: none;
  }
  &__more {
    position: absolute;
    top: 0px;
    right: 0px;
    margin: 5px;
    opacity: 0;
    z-index: -1;
    background-color: setColor(white, 0.7);
    border-radius: 2px;
    transition: opacity 0.2s ease-out;
    &:hover {
      background-color: setColor(white, 1);
    }
  }
  &__edit {
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
