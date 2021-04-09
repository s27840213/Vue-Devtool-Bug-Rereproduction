<template lang="pug">
  div(class="editor-view bg-gray-6")
    div(class="page-section")
      nu-page(v-for="(page,index) in pages"
        :key="`page-${index}`"
        :config="page" :index="index")
</template>

<script lang="ts">
import Vue from 'vue'
import { mapGetters } from 'vuex'

export default Vue.extend({
  components: {
  },
  data() {
    return {
    }
  },
  methods: {

  },
  computed: {
    ...mapGetters({
      pages: 'editor/getPages'
    })
  }
})
</script>

<style lang="scss" scoped>
.editor-view {
  @include size(100%, 100%);
  position: relative;
  max-width: 100%;
  max-height: 100%;
  z-index: setZindex("editor-view");
  position: relative;
  overflow-y: scroll;
}

.page-section {
  min-width: 100%;
  min-height: 100%;
  padding: 30px;
  position: absolute;
  box-sizing: border-box;
  @include flexCenter;
}
</style>
