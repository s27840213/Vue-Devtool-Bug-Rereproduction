<template lang="pug">
  div(v-if="last" class="page-preview-plus-last")
  div(v-else class="page-preview-plus"
  @mouseover="pageMoveTo($event)" @mouseout="pageMoveBack($event)")
    div(class="page-preview-plus-wrapper pointer"
      @click="addPage(index)")
        svg-icon(class="pb-5"
            :iconColor="'blue-1'"
            :iconName="'plus-origin'"
            :iconWidth="'18px'")
        span 新增
        span 頁面
</template>
<script lang="ts">
import Vue from 'vue'
import { mapGetters, mapMutations } from 'vuex'
import pageUtils from '@/utils/pageUtils'

export default Vue.extend({
  props: {
    index: Number,
    last: Boolean
  },
  computed: {
    ...mapGetters({
      getPagesPerRow: 'page/getPagesPerRow'
    })
  },
  methods: {
    ...mapMutations({
      _addPageToPos: 'ADD_pageToPos',
      _setFocusPage: 'page/SET_focusPage'
    }),
    pageMoveTo($event: any) {
      const prev = $event.currentTarget.previousElementSibling
      if (prev) {
        prev.style.transform = 'translate(-15px)'
      }
      const next = $event.currentTarget.nextElementSibling
      if (next) {
        next.style.transform = 'translate(15px)'
      }
    },
    pageMoveBack($event: any) {
      const prev = $event.currentTarget.previousElementSibling
      if (prev) {
        prev.style.transform = ''
      }
      const next = $event.currentTarget.nextElementSibling
      if (next) {
        next.style.transform = ''
      }
    },
    addPage(position: number) {
      this._addPageToPos({
        newPage: pageUtils.newPage({}),
        pos: position
      })
      this._setFocusPage(position)
    }
  }
})
</script>
<style lang="scss" scoped>
.page-preview-plus {
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
    height: 180px;
    width: 30px;
    opacity: 0;
    transition: 0.25s;

    &:hover {
      opacity: 1;
    }

    &-wrapper {
      position: absolute;
      display: flex;
      justify-content: center;
      align-items: center;
      flex-direction: column;
      width: 40px;
      height: 70px;
      font-size: 10px;
      background: setColor(gray-4);
    }

    &-last {
      opacity: 0;
    }
}
</style>
