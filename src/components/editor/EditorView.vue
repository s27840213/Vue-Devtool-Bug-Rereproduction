<template lang="pug">
  div(class="editor-view bg-gray-6")
    nu-page(v-for="(page,index) in pages"
      :key="`page-${index}`"
      :pageIndex="index"
      :config="page" :index="index" )
</template>

<script lang="ts">
import Vue from 'vue'
import { mapGetters } from 'vuex'

export default Vue.extend({
  data() {
    return {
    }
  },
  methods: {

  },
  computed: {
    ...mapGetters({
      pages: 'getPages'
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
</style>
