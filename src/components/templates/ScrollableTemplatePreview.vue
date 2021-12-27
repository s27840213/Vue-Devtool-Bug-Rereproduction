<template lang="pug">
  div(class="scrollable-template-preview")
    img(:src="imageUrl")
</template>

<script lang="ts">
import Vue from 'vue'
import templateCenterUtils from '@/utils/templateCenterUtils'
import { IContentTemplate } from '@/interfaces/template'

export default Vue.extend({
  props: {
    isMobile: Boolean,
    contentIds: Array
  },
  computed: {
    typedContentIds(): IContentTemplate[] {
      return this.contentIds as IContentTemplate[]
    },
    imageUrl(): string {
      const content = this.typedContentIds[0]
      return templateCenterUtils.getPrevUrl(content)
    }
  },
  watch: {
  },
  data() {
    return {}
  },
  methods: {
  }
})
</script>

<style lang="scss" scoped>
.scrollable-template-preview {
  width: 100%;
  height: 100%;
  > img {
    width: 100%;
    height: 100%;
  }
}
</style>
