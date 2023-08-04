<template lang="pug">
div(class="panel-bg__item"
    @click="addBackground"
    @click.right.prevent="openUpdateDesignPopup()")
  img(class="panel-bg__img"
    ref="img"
    crossorigin="anonymous"
    draggable="false"
    :src="src || fallbackSrc || imageUtils.getSrc({ srcObj: { type: 'background', assetId: item.id, userId: '' }}, 'prev', item.ver)"
    @error="handleNotFound")
  pro-item(v-if="item.plan")
</template>

<script lang="ts">
import ProItem from '@/components/payment/ProItem.vue'
import i18n from '@/i18n'
import { IListServiceContentDataItem } from '@/interfaces/api'
import store from '@/store'
import AssetUtils from '@/utils/assetUtils'
import imageUtils from '@/utils/imageUtils'
import paymentUtils from '@/utils/paymentUtils'
import { notify } from '@kyvg/vue3-notification'
import { defineComponent, PropType } from 'vue'
import { mapGetters } from 'vuex'

export default defineComponent({
  emits: [],
  components: {
    ProItem
  },
  props: {
    src: {
      type: String
    },
    item: {
      type: Object as PropType<IListServiceContentDataItem>,
      required: true
    },
    locked: {
      type: Boolean,
      required: true
    }
  },
  data() {
    return {
      fallbackSrc: '',
      imageUtils
    }
  },
  computed: {
    ...mapGetters('user', {
      isAdmin: 'isAdmin'
    })
  },
  methods: {
    handleNotFound(event: Event) {
      this.fallbackSrc = require('@/assets/img/svg/image-preview.svg') // prevent infinite refetching when network disconneted
    },
    addBackground() {
      if (!paymentUtils.checkPro(this.item as {plan: number}, 'pro-bg')) return
      if (this.locked) {
        return notify({ group: 'copy', text: i18n.global.tc('NN0804') })
      }
      const img = this.$refs.img as HTMLImageElement
      if (!img) {
        console.error('img in background category is null')
        return
      }
      const panelPreviewSrc = img.src
      const imgSrcSize = {
        width: img.naturalWidth,
        height: img.naturalHeight
      }
      AssetUtils.addAsset(this.item, { panelPreviewSrc, imgSrcSize })
    },
    openUpdateDesignPopup() {
      if (this.isAdmin) {
        const isUpdateDesignOpen = true
        const updateDesignId = this.item.id
        const updateDesignType = 'background'
        store.commit('user/SET_STATE', { isUpdateDesignOpen, updateDesignId, updateDesignType })
      }
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
    width: min(calc((100vw - 10px - 48px) / 2), 145px);
    height: min(calc((100vw - 10px - 48px) / 2), 145px);
    margin: 0 auto;
    object-fit: cover;
    vertical-align: middle;
  }
}
</style>
