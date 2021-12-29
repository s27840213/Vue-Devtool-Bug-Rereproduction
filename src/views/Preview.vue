<template lang="pug">
  page-content(v-if="pages.length > 0" :config="pages[0]" :pageIndex="0")
</template>

<script lang="ts">
import Vue from 'vue'
import PageContent from '@/components/editor/page/PageContent.vue'
import { mapGetters, mapMutations, mapState } from 'vuex'
import uploadUtils from '@/utils/uploadUtils'
import store from '@/store'
import rulerUtils from '@/utils/rulerUtils'
import stepsUtils from '@/utils/stepsUtils'
import logUtils from '@/utils/logUtils'

export default Vue.extend({
  name: 'Preview',
  components: {
    PageContent
  },
  data() {
    return {}
  },
  computed: {
    ...mapGetters({
      pages: 'getPages'
    })
  },
  mounted() {
    const type = this.$router.currentRoute.query.type
    const designId = this.$router.currentRoute.query.design_id
    const teamId = this.$router.currentRoute.query.team_id
    if (!type || !designId || !teamId) {
      uploadUtils.hasGottenDesign = true
    }
  }
})
</script>

<style lang="scss" scoped>
.editor {
  @include size(100%, 100%);
  max-height: 100%;
  display: grid;
  grid-template-rows: minmax(0, 1fr);
  grid-template-columns: auto 1fr;
  > section:nth-child(2) {
    display: grid;
    grid-template-rows: minmax(0, 1fr);
    grid-template-columns: 1fr;
  }
}

.content {
  display: grid;
  grid-template-rows: minmax(0, 1fr);
  grid-template-columns: auto 1fr auto;
  height: 100%;
  &__main {
    display: grid;
    grid-template-rows: minmax(0, 1fr);
    grid-template-columns: 1fr;
  }

  &__editor {
    position: relative;
    height: 100%;
    display: grid;
    grid-template-rows: minmax(0, 1fr);
    grid-template-columns: 1fr auto;
  }

  &__panel {
    position: relative;
    width: 100%;
    height: 100%;
    display: grid;
    grid-template-columns: 1fr;
  }

  &__pages {
    position: absolute;
    width: 100%;
    height: 100%;
    overflow-y: scroll;
    z-index: setZindex("pages-preview");
    background: setColor(gray-6);
  }
}

.header-container {
  // must set to 100% or sticky div won't work
  height: 100%;
  position: absolute;
  top: 0;
  left: 50%;
  transform: translate3d(-50%, 0px, 0);
  z-index: setZindex("editor-header");
  pointer-events: none;
}

.admin-options {
  height: 100%;
  position: absolute;
  top: 0;
  right: 30px;
  z-index: setZindex("editor-header");
  font-size: 10px;
  pointer-events: none;
  &__sticky-container {
    display: flex;
    justify-content: center;
    align-items: center;
    position: sticky;
    top: 0;
    left: 0;
    background-color: white;
    padding: 5px 10px;
    border-radius: 0 0 0.25rem 0.25rem;
    box-shadow: 0px 2px 10px setColor(gray-2, 0.1);
    pointer-events: auto;
  }
}

.scale-ratio-editor::v-deep {
  position: absolute;
  bottom: 0px;
  z-index: setZindex("scale-ratio-editor");
}
</style>
