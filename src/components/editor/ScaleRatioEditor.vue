<template lang="pug">
  div(class="scale-ratio-editor")
    input(ref="scale-ratio-editor" type="range" min="0.1" max="5" step="0.01"
      v-model="ratioInPercent"
      :disabled="isShowPagePreview"
      @input="setScaleRatio(Math.round(ratioInPercent*100))"
      v-ratio-change)
    div(class="scale-ratio-editor__percentage lead-2")
      span(class="text-gray-2") {{pageScaleRatio}}%
    svg-icon(class="pointer" @click.native="plus()"
      :iconName="'chevron-down'" :iconColor="'gray-2'" iconWidth="16px")
    svg-icon(class="hover-effect pointer"
      @click.native="setIsShowPagePreview(!isShowPagePreview)"
      :iconName="'grid'" :iconColor="'gray-2'" iconWidth="24px")
    svg-icon(:class="{'hover-effect': !isShowPagePreview}"
      :iconName="'navPage'"
      :iconColor="isShowPagePreview ? 'gray-4' :'gray-2'"
      :iconWidth="'24px'"
      :disabled="isShowPagePreview"
      @click.native="setShowPagePanel(!showPagePanel)")
</template>

<script lang="ts">
import Vue from 'vue'
import { mapGetters, mapMutations } from 'vuex'
import pageUtils from '@/utils/pageUtils'

export default Vue.extend({
  data() {
    return {
    }
  },
  computed: {
    ...mapGetters({
      pageScaleRatio: 'getPageScaleRatio',
      isShowPagePreview: 'page/getIsShowPagePreview',
      lastSelectedPageIndex: 'getLastSelectedPageIndex',
      showPagePanel: 'page/getShowPagePanel'
    }),
    ratioInPercent: {
      get(): number {
        return this.pageScaleRatio / 100
      },
      set(val: number): void {
        this.setScaleRatio(Math.round(val * 100))
      }
    }
  },
  methods: {
    ...mapMutations({
      _setScaleRatio: 'SET_pageScaleRatio',
      _setIsShowPagePreview: 'page/SET_isShowPagePreview',
      _setShowPagePanel: 'page/SET_showPagePanel'
    }),
    setScaleRatio(ratio: number) {
      this._setScaleRatio(ratio)
    },
    setIsShowPagePreview(show: boolean) {
      this._setIsShowPagePreview(show)
      if (!show) {
        pageUtils.jumpIntoPage(this.lastSelectedPageIndex)
        this._setShowPagePanel(false)
      }
    },
    setShowPagePanel(show: boolean) {
      this.toggleSidebarPanel(show)
      this._setShowPagePanel(show)
    },
    toggleSidebarPanel(open: boolean) {
      this.$emit('toggleSidebarPanel', open)
    }
  }
})
</script>

<style lang="scss" scoped>
.scale-ratio-editor {
  display: grid;
  grid-template-rows: auto;
  grid-template-columns: auto auto auto auto auto;
  background-color: setColor(white);
  align-items: center;
  box-shadow: 0px 0px 5px setColor(gray-2, 0.3);
  padding: 7px 14px;
  border-radius: 7px 7px 0 0;
  column-gap: 5px;
  input[type="range"] {
    background: setColor(gray-6);
    &:focus {
      outline: none;
    }
  }
  &__percentage {
    // border: 1px solid setColor(gray-2, 0.3);
    width: 2.5rem;
  }
}

.hover-effect {
  &:hover {
    background-color: #d9dbe1;
  }
}
</style>
