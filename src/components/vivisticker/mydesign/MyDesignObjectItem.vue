<template lang="pug">
  div(class="my-design-object-item"
      @click="addSvg"
      v-press="addSvg")
    img(class="my-design-object-item__img"
      draggable="false"
      :src="src")
    //- pro-item(v-if="item.plan")
    div(v-if="item.type !== 8" class="my-design-object-item__more" @click.stop.prevent="handleMoreActions")
      svg-icon(iconName="more" iconColor="white" iconWidth="24px")
</template>

<script lang="ts">
import Vue from 'vue'
import ProItem from '@/components/payment/ProItem.vue'
import paymentUtils from '@/utils/paymentUtils'
import generalUtils from '@/utils/generalUtils'
import vivistickerUtils from '@/utils/vivistickerUtils'
import assetUtils from '@/utils/assetUtils'
import pageUtils from '@/utils/pageUtils'
import { mapMutations } from 'vuex'

export default Vue.extend({
  components: {
    ProItem
  },
  props: {
    item: Object
  },
  computed: {
    src(): string {
      return vivistickerUtils.getThumbSrc('mydesign', this.item.id)
    }
  },
  methods: {
    ...mapMutations({
      setMyDesignBuffer: 'SET_myDesignBuffer'
    }),
    addSvg() {
      // if (!paymentUtils.checkPro(this.item, 'pro-object')) return
      if (this.item.type === 8) {
        // this.handleEditObject()
      } else {
        // vivistickerUtils.sendScreenshotUrl(vivistickerUtils.createUrlForJSON(this.item))
      }
    },
    // handleEditObject() {
    //   vivistickerUtils.startEditing(this.item.editorType, vivistickerUtils.getFetchDesignInitiator(() => {
    //     pageUtils.setPages(pageUtils.newPages(this.item.pages))
    //   }), vivistickerUtils.getEmptyCallback())
    // }
    handleMoreActions() {
      this.setMyDesignBuffer(this.item)
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
