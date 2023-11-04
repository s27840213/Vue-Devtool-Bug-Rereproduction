<template lang="pug">
div(class="panel-text__item"
    draggable="true"
    @dragstart="$isPic ? dragStart($event) : null"
    @click="addText"
    @click.right.prevent="$isPic ? openUpdateDesignPopup() : null")
  img(class="panel-text__img"
    ref="img"
    :src="src || fallbackSrc || `https://template.vivipic.com/text/${item.id}/prev?ver=${item.ver}`"
    :style="itemStyle"
    @error="handleNotFound")
  pro-item(v-if="item.plan")
</template>

<script lang="ts">
import ProItem from '@/components/payment/ProItem.vue'
import store from '@/store'
import AssetUtils from '@/utils/assetUtils'
import DragUtils from '@/utils/dragUtils'
import paymentUtils from '@/utils/paymentUtils'
import stkWVUtils from '@/utils/stkWVUtils'
import textPropUtils from '@/utils/textPropUtils'
import vuexUtils from '@/utils/vuexUtils'
import imagePreview from '@img/svg/image-preview.svg'
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
    },
    itemWidth: {
      type: Number,
      default: NaN
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
    ...vuexUtils.mapGetters('stk', {
      isInEditor: true,
    }, {
      isInEditor: 'vivisticker/getIsInEditor'
    }),
    itemStyle(): any {
      const { width } = this.item.preview || {
        width: !isNaN(this.itemWidth) ? this.itemWidth
          : this.$isTouchDevice() ? (window.outerWidth - (this.$isPic ? 54 : 68)) / 3 - 10 // ([window width] - [padding and gap]) / 3 - [item margin]
          : 135
      }
      return {
        width: `${width}px`
      }
    },
  },
  methods: {
    handleNotFound(event: Event) {
      this.fallbackSrc = imagePreview // prevent infinite refetching when network disconneted
    },
    dragStart(e: DragEvent) {
      if (!paymentUtils.checkPro(this.item, 'pro-text')) return
      const img = this.$refs.img as HTMLImageElement
      this.dragUtils.itemDragStart(e, 'group', {
        ...this.item
      }, img.src, { aspectRatio: img.naturalWidth / img.naturalHeight })
    },
    addText() {
      if (this.$isPic && !paymentUtils.checkPro(this.item, 'pro-text')) return
      if (this.$isStk && !stkWVUtils.checkPro(this.item, 'text')) return
      if (this.isInEditor) {
        AssetUtils.addAsset(this.item)
          .then(() => {
            textPropUtils.updateTextPropsState()
          })
      } else {
        stkWVUtils.startEditing('text', {
          plan: this.item.plan,
          assetId: this.item.id,
          fit: this.item.fit ?? 0,
        }, stkWVUtils.getAssetInitiator(this.item), stkWVUtils.getAssetCallback(this.item))
      }
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
    -webkit-touch-callout: none;
    user-select: none;
  }
  &__img {
    width: 80px;
    height: 80px;
    margin: 0 5px;
    object-fit: contain;
    vertical-align: middle;
    -webkit-touch-callout: none;
    user-select: none;
    pointer-events: none;
  }
}
</style>
