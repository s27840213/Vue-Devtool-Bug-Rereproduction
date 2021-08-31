<template lang="pug">
  img(class="pointer"
    draggable="true"
    :src="src"
    @error="handleNotFound"
    @dragstart="dragStart($event)"
    @click="addTemplate")
</template>

<script lang="ts">
import Vue from 'vue'
import { mapGetters } from 'vuex'
import PageUtils from '@/utils/pageUtils'
import TemplateUtils from '@/utils/templateUtils'
import GeneralUtils from '@/utils/generalUtils'
import { IParagraph, IText } from '@/interfaces/layer'

export default Vue.extend({
  props: {
    src: String,
    objectId: String
  },
  components: {},
  computed: {
    ...mapGetters({
      lastSelectedPageIndex: 'getLastSelectedPageIndex',
      getJson: 'getJson',
      getTextInfo: 'getTextInfo'
    })
  },
  mounted () {
    if (!this.getJson(this.objectId)) {
      this.$emit('init', this.objectId)
    }
  },
  methods: {
    handleNotFound(event: Event) {
      (event.target as HTMLImageElement).src = require('@/assets/img/svg/image-preview.svg')
    },
    dragStart(event: DragEvent) {
      const json = TemplateUtils.updateTemplate(this.getJson(this.objectId))
      const dataTransfer = event.dataTransfer as DataTransfer
      dataTransfer.dropEffect = 'move'
      dataTransfer.effectAllowed = 'move'
      dataTransfer.setDragImage((event.target as HTMLImageElement), 0, 0)
      const config = {
        type: 'page',
        json
      }
      dataTransfer.setData('data', JSON.stringify(config))
    },
    addTemplate() {
      const json = TemplateUtils.updateTemplate(this.getJson(this.objectId))
      PageUtils.updateSpecPage(this.lastSelectedPageIndex, json[0] || json)
    }
  }
})
</script>

<style lang="scss" scoped>
</style>
