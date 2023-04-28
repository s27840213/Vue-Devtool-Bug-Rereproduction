<template lang="pug">
div(class="panel-text__item"
    draggable="true"
    @dragstart="dragStart($event)"
    @click="addText"
    @click.right.prevent="openUpdateDesignPopup()")
  img(class="panel-text__img"
    ref="img"
    :src="src || fallbackSrc || `https://template.vivipic.com/text/${item.id}/prev?ver=${item.ver}`"
    :style="itemStyle"
    @error="handleNotFound")
  pro-item(v-if="item.plan" draggable="false")
</template>

<script lang="ts">
import ProItem from '@/components/payment/ProItem.vue'
import store from '@/store'
import AssetUtils from '@/utils/assetUtils'
import DragUtils from '@/utils/dragUtils'
import paymentUtils from '@/utils/paymentUtils'
import textPropUtils from '@/utils/textPropUtils'
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
      type: Object as PropType<any>,
      required: true
    }
  },
  data() {
    return {
      fallbackSrc: '',
      dragUtils: new DragUtils()
    }
  },
  computed: {
    ...mapGetters('user', {
      isAdmin: 'isAdmin'
    }),
    itemStyle(): any {
      const { width } = this.item.preview || {
        width: this.$isTouchDevice()
          ? (window.innerWidth - 54) / 3 - 10 // ([window width] - [padding and gap]) / 3 - [item margin]
          : 135
      }
      return {
        objectFit: 'contain',
        width: `${width}px`
      }
    },
  },
  methods: {
    handleNotFound(event: Event) {
      this.fallbackSrc = require('@/assets/img/svg/image-preview.svg') // prevent infinite refetching when network disconneted
    },
    dragStart(e: DragEvent) {
      if (!paymentUtils.checkPro(this.item, 'pro-text')) return
      const img = this.$refs.img as HTMLImageElement
      this.dragUtils.itemDragStart(e, 'group', {
        ...this.item
      }, img.src, { aspectRatio: img.naturalWidth / img.naturalHeight })
    },
    addText() {
      if (!paymentUtils.checkPro(this.item, 'pro-text')) return
      AssetUtils.addAsset(this.item)
        .then(() => {
          textPropUtils.updateTextPropsState()
        })
    },
    openUpdateDesignPopup() {
      if (this.isAdmin) {
        const isUpdateDesignOpen = true
        const updateDesignId = this.item.id
        const updateDesignType = 'text'
        store.commit('user/SET_STATE', { isUpdateDesignOpen, updateDesignId, updateDesignType })
      }
    }
  }
})
</script>

<style lang="scss" scoped>
.panel-text {
  &__item {
    position: relative;
    cursor: pointer;
  }
  &__img {
    width: 80px;
    height: 80px;
    margin: 0 5px;
    object-fit: contain;
    vertical-align: middle;
  }
}
</style>
