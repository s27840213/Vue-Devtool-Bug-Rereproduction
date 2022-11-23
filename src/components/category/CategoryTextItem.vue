<template lang="pug">
img(class="pointer"
  :src="src || fallbackSrc || `https://template.vivipic.com/text/${item.id}/prev?ver=${item.ver}`"
  draggable="true"
  :style="itemStyle"
  @dragstart="dragStart($event)"
  @click="addText"
  @click.right.prevent="openUpdateDesignPopup()"
  @error="handleNotFound")
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import store from '@/store'
import { mapGetters } from 'vuex'
import AssetUtils from '@/utils/assetUtils'
import textPropUtils from '@/utils/textPropUtils'
import DragUtils from '@/utils/dragUtils'
import generalUtils from '@/utils/generalUtils'

export default defineComponent({
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
  data() {
    return {
      fallbackSrc: ''
    }
  },
  components: {},
  computed: {
    ...mapGetters('user', {
      isAdmin: 'isAdmin'
    }),
    itemStyle(): any {
      const { width } = this.item.preview || {
        width: generalUtils.isTouchDevice()
          ? (window.innerWidth - 54) / 3 - 10 // ([window width] - [padding and gap]) / 3 - [item margin]
          : 135
      }
      return {
        objectFit: 'contain',
        width: `${width}px`
      }
    }
  },
  methods: {
    handleNotFound(event: Event) {
      this.fallbackSrc = require('@/assets/img/svg/image-preview.svg') // prevent infinite refetching when network disconneted
    },
    dragStart(e: DragEvent) {
      new DragUtils().itemDragStart(e, 'group', {
        ...this.item
      })
    },
    addText() {
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
</style>
