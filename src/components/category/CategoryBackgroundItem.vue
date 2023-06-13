<template lang="pug">
div(class="panel-bg__item"
    v-press="handleShare"
    @click="addBackground")
  img(class="panel-bg__img"
    ref="img"
    :src="src || fallbackSrc || imageUtils.getSrc({ srcObj: { type: 'background', assetId: item.id, userId: '' }}, 'prev', item.ver)"
    draggable="false"
    @error="handleNotFound")
  div(v-if="!isInEditor" class="panel-bg__share" @click.stop.prevent="handleShare")
    svg-icon(iconName="share" iconColor="white" iconWidth="16px")
  pro-item(v-if="item.plan" draggable="false")
</template>

<script lang="ts">
import ProItem from '@/components/payment/ProItem.vue'
import { IAsset } from '@/interfaces/module'
import assetUtils from '@/utils/assetUtils'
import imageUtils from '@/utils/imageUtils'
import vivistickerUtils from '@/utils/vivistickerUtils'
import { defineComponent, PropType } from 'vue'
import { mapGetters } from 'vuex'

export default defineComponent({
  emits: ['share'],
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
  },
  data() {
    return {
      fallbackSrc: '',
      imageUtils
    }
  },
  computed: {
    ...mapGetters({
      isAdmin: 'user/isAdmin',
      isInEditor: 'vivisticker/getIsInEditor'
    })
  },
  methods: {
    handleNotFound() {
      this.fallbackSrc = require('@/assets/img/svg/image-preview.svg') // prevent infinite refetching when network disconneted
    },
    addBackground() {
      if (!vivistickerUtils.checkPro(this.item, 'object')) return
      if (this.isInEditor) return assetUtils.addAsset(this.item, undefined, 'background')
      vivistickerUtils.sendScreenshotUrl(vivistickerUtils.createUrl(this.item))
      assetUtils.addAssetToRecentlyUsed(this.item, 'background')
    },
    handleShare() {
      if (!vivistickerUtils.checkPro(this.item, 'object')) return
      this.$emit('share', this.item)
    }
  }
})
</script>

<style lang="scss" scoped>
.panel-bg {
  &__item {
    position: relative;
    cursor: pointer;
  }
  &__img {
    // width: min(calc((100vw - 10px - 48px) / 2), 145px);
    // height: min(calc((100vw - 10px - 48px) / 2), 145px);
    width: 100%;
    height: 100%;
    // margin: 0 auto;
    object-fit: cover;
    vertical-align: middle;
    -webkit-touch-callout: none;
    user-select: none;
  }
  &__share {
    position: absolute;
    @include size(24px);
    display: flex;
    align-items: center;
    justify-content: center;
    position: absolute;
    right: 4px;
    bottom: 4px;
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
