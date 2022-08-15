<template lang="pug">
  div(class="category-object-item"
      @click="addSvg")
    img(class="category-object-item__img"
      draggable="false"
      :src="src || `https://template.vivipic.com/svg/${item.id}/prev?ver=${item.ver}`")
    pro-item(v-if="item.plan")
</template>

<script lang="ts">
import Vue from 'vue'
import DragUtils from '@/utils/dragUtils'
import assetUtils, { RESIZE_RATIO_SVG } from '@/utils/assetUtils'
import { mapMutations } from 'vuex'
import ProItem from '@/components/payment/ProItem.vue'
import paymentUtils from '@/utils/paymentUtils'
import generalUtils from '@/utils/generalUtils'
import vivistickerUtils from '@/utils/vivistickerUtils'

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
  created() {
    this.item.db = 'svg'
  },
  methods: {
    addSvg() {
      if (!paymentUtils.checkPro(this.item, 'pro-object')) return
      // assetUtils.addAsset(this.item)
      vivistickerUtils.sendScreenshotUrl(vivistickerUtils.createUrl(this.item))
    }
  }
})
</script>

<style lang="scss" scoped>
.category-object-item {
  $this: &;
  position: relative;
  cursor: pointer;
  &__img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    vertical-align: middle;
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
  &:hover {
    #{$this}__more {
      opacity: 1;
      z-index: 1;
    }
  }
}
</style>
