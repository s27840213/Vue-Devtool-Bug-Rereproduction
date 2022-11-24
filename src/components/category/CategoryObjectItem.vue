<template lang="pug">
div(class="category-object-item"
    @click="addSvg"
    @click.right.prevent="openUpdateDesignPopup()"
    @dragstart="dragStart($event)")
  img(class="category-object-item__img"
    draggable="true"
    :src="src || `https://template.vivipic.com/svg/${item.id}/prev?ver=${item.ver}`")
  svg-icon(v-if="!isTouchDevice && (item.info || (item.tags && item.tags.length > 0))"
    class="category-object-item__more"
    @click.native="showSvgInfo"
    :iconName="'more_vertical'"
    :iconColor="'gray-2'"
    :iconWidth="'20px'")
  pro-item(v-if="item.plan")
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import store from '@/store'
import DragUtils from '@/utils/dragUtils'
import assetUtils, { RESIZE_RATIO_SVG } from '@/utils/assetUtils'
import { mapMutations, mapGetters } from 'vuex'
import ProItem from '@/components/payment/ProItem.vue'
import paymentUtils from '@/utils/paymentUtils'
import generalUtils from '@/utils/generalUtils'

export default defineComponent({
  components: {
    ProItem
  },
  props: {
    src: {
      type: String,
      required: true
    },
    item: {
      type: Object,
      required: true
    }
  },
  computed: {
    ...mapGetters('user', {
      isAdmin: 'isAdmin'
    }),
    isTouchDevice(): boolean {
      return generalUtils.isTouchDevice()
    }
  },
  methods: {
    ...mapMutations({
      _setCurrSelectedResInfo: 'SET_currSelectedResInfo'
    }),
    dragStart(e: DragEvent) {
      if (!paymentUtils.checkPro(this.item as any, 'pro-object')) return
      const type = assetUtils.getLayerType(this.item.type)
      new DragUtils().itemDragStart(e, type || '', {
        ...this.item
      }, {
        resizeRatio: RESIZE_RATIO_SVG
      })
    },
    addSvg() {
      if (!paymentUtils.checkPro(this.item as any, 'pro-object')) return
      assetUtils.addAsset(this.item as any, { db: 'svg' })
    },
    showSvgInfo(evt: Event) {
      const { info = {}, tags } = this.item
      this._setCurrSelectedResInfo({
        type: 'object',
        userName: info.author?.name ?? '',
        userLink: info.author?.url ?? '',
        authorCompany: info.author?.company ?? '',
        tags,
        licenseName: info.license?.name ?? '',
        licenseLink: info.license?.url ?? ''
      })
      this.$nextTick(() => {
        const el = document.querySelector('.res-info') as HTMLElement
        const { top, left, height } = (evt.target as HTMLElement).getBoundingClientRect()
        el.style.transform = `translate(${left}px, ${top + height + 5}px)`
        el.focus()
      })
    },
    openUpdateDesignPopup() {
      if (this.isAdmin) {
        const isUpdateDesignOpen = true
        const updateDesignId = this.item.id
        const updateDesignType = 'svg'
        store.commit('user/SET_STATE', { isUpdateDesignOpen, updateDesignId, updateDesignType })
      }
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
