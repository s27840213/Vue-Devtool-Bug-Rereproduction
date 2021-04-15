<template lang="pug">
  div(class="editor-view bg-blue-3")
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
  box-sizing: border-box;
  position: relative;
  z-index: setZindex("editor-view");
  overflow: scroll;
}
</style>
