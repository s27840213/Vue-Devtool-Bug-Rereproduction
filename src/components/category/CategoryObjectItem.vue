<template lang="pug">
  div(class="category-object-item")
    img(class="pointer category-object-item__img"
      draggable="true"
      :src="src || `https://template.vivipic.com/svg/${item.id}/prev?ver=${item.ver}`"
      @dragstart="dragStart($event)"
      @click="addSvg")
    svg-icon(v-if="item.info || (item.tags && item.tags.length > 0)"
      class="pointer category-object-item__more"
      @click.native="showSvgInfo"
      :iconName="'more_vertical'"
      :iconColor="'gray-2'"
      :iconWidth="'20px'")
    pro-item(v-if="item.plan")
</template>

<script lang="ts">
import Vue from 'vue'
import DragUtils from '@/utils/dragUtils'
import assetUtils, { RESIZE_RATIO_SVG } from '@/utils/assetUtils'
import { mapMutations } from 'vuex'
import ProItem from '@/components/payment/ProItem.vue'
import paymentUtils from '@/utils/paymentUtils'

export default Vue.extend({
  components: {
    ProItem
  },
  props: {
    src: String,
    item: Object
  },
  methods: {
    ...mapMutations({
      _setCurrSelectedResInfo: 'SET_currSelectedResInfo'
    }),
    dragStart(e: DragEvent) {
      const type = assetUtils.getLayerType(this.item.type)
      new DragUtils().itemDragStart(e, type || '', {
        ...this.item
      }, {
        resizeRatio: RESIZE_RATIO_SVG
      })
    },
    addSvg() {
      if (!paymentUtils.checkProObject(this.item, 'pro-object')) return
      assetUtils.addAsset(this.item)
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
        el.style.transform = `translate3d(${left}px, ${top + height + 5}px,0)`
        el.focus()
      })
    }
  }
})
</script>

<style lang="scss" scoped>
.category-object-item {
  $this: &;
  position: relative;
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
