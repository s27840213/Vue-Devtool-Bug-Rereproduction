<template lang="pug">
div(class="preview" :style="containStyles")
  page-content(v-if="config" :config="config" :pageIndex="0" :contentScaleRatio="contentScaleRatio" :forceRender="true")
  span(v-if="host" class="preview__host") {{host}}
</template>

<script lang="ts">
import PageContent from '@/components/editor/page/PageContent.vue'
import { IPage } from '@/interfaces/page'
import pageUtils from '@/utils/pageUtils'
import { defineComponent } from 'vue'
import { mapGetters, mapMutations, mapState } from 'vuex'

export default defineComponent({
  emits: [],
  name: 'Preview',
  components: {
    PageContent
  },
  data() {
    return {}
  },
  computed: {
    ...mapState({
      contentScaleRatio: 'defaultContentScaleRatio'
    }),
    ...mapGetters({
      pages: 'getPages'
    }),
    host(): string {
      const host = window.location.host
      const subdomain = host.match(/(.+).vivipic.com/)
      const urlParams = new URLSearchParams(window.location.search)

      if (['test.vivipic.com', 'vivipic.com'].includes(host) ||
        urlParams.has('hideHostLabel')) return ''
      else if (host === 'localhost:8080') return 'local'
      else if (subdomain) return subdomain[1]
      else return host
    },
    config(): IPage | undefined {
      if (this.pages.length === 0) return undefined
      const page = this.pages[0]
      if (!page.isEnableBleed) return page
      return {
        ...page,
        ...pageUtils.getPageSizeWithBleeds(page)
      }
    },
    containStyles(): any {
      return {
        transform: `scale(${1 / this.contentScaleRatio})`
      }
    }
  },
  methods: {
    ...mapMutations({
      setInScreenshotPreview: 'SET_inScreenshotPreview',
      setIsGettingDesign: 'SET_isGettingDesign'
    })
  },
  mounted() {
    const type = this.$router.currentRoute.value.query.type
    const designId = this.$router.currentRoute.value.query.design_id
    const teamId = this.$router.currentRoute.value.query.team_id
    if (!type || !designId || !teamId) {
      this.setIsGettingDesign(false)
    }

    this.setInScreenshotPreview(true)
  },
  beforeUnmount() {
    this.setInScreenshotPreview(false)
  }
})
</script>

<style lang="scss" scoped>
.preview {
  position: relative;
  &__host {
    @include body-LG;
    position: absolute;
    top: 0;
    left: 0;
    color: black;
    background-color: setColor(white);
  }
}
</style>
