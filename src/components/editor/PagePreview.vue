<template lang="pug">
div(class="page-preview")
    template(v-for="(page, idx) in getPages" style="display: flex; flex-direction: row;")
        page-preview-plus(:index="idx" last=false)
        page-preview-page(:pagename="page.name")
        page-preview-plus(v-if="(idx+1) % getPagesPerRow === 0"
                        :index="idx" last=false)
    page-preview-plus(:index="getPages.length" last=true)
    page-preview-page(pagename="last")
</template>
<script lang="ts">
import Vue from 'vue'
import { mapGetters, mapMutations } from 'vuex'
import PagePreviewPage from '@/components/editor/pagePreview/pagePreviewPage.vue'
import PagePreviewPlus from '@/components/editor/pagePreview/pagePreviewPlus.vue'
import { floor } from 'lodash'

export default Vue.extend({
  data() {
    return {
      screenWidth: 0
    }
  },
  components: {
    PagePreviewPage,
    PagePreviewPlus
  },
  computed: {
    ...mapGetters({
      getPages: 'getPages',
      getPagesPerRow: 'page/getPagesPerRow'
    })
  },
  mounted() {
    window.addEventListener('resize', () => {
      this.screenWidth = document.body.clientWidth - 130
      this._setPagesPerRow(floor(this.screenWidth / 180))
    })
  },
  methods: {
    ...mapMutations({
      _setPagesPerRow: 'page/SET_PagesPerRow'
    })
  }
})
</script>
<style lang="scss" scoped>
.page-preview {
    display: grid;
    align-items: center;
    justify-content: center;
    width: calc(100% - 100px);
    grid-template-columns: repeat(auto-fill, 30px 150px) 30px;
    grid-row-gap: 20px;
    padding: 30px 0;

    &-group {
        position: relative;
        display: inline-flex;
        height: 180px;
        margin-top: 30px 0;
    }
}
</style>
