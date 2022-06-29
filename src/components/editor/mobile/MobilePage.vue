<template lang="pug">
  div(class="mobile-page")
    nu-page(v-for="(page,index) in pages"
            :ref="`page-${index}`"
            :key="`page-${index}`"
            :pageIndex="index"
            :editorView="editorView"
            :style="{'z-index': `${getPageZIndex(index)}`}"
            :config="page" :index="index" :isAnyBackgroundImageControl="isBackgroundImageControl"
            @stepChange="handleStepChange")
</template>

<script lang="ts">
import Vue from 'vue'

export default Vue.extend({
  data() {
    return {
    }
  }
})
</script>

<style lang="scss" scoped>
.mobile-page {
  height: 100%;
}
</style>
