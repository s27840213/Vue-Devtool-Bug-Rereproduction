<template lang="pug">
  div(class="size-editor")
    input(ref="size-editor" type="range" min="0.1" max="5" step="0.01" v-model="ratioInPercent"
      @input="setScaleRatio(Math.round(ratioInPercent*100))"
      v-ratio-change)
    div(class="size-editor__percentage lead-2")
      span(class="text-gray-2") {{pageScaleRatio}}%
    svg-icon(class="pointer" @click.native="plus()"
      :iconName="'chevron-down'" :iconColor="'gray-2'" iconWidth="16px")
</template>

<script lang="ts">
import Vue from 'vue'
import { mapGetters, mapMutations } from 'vuex'
export default Vue.extend({
  data() {
    return {
      ratioInPercent: 0
    }
  },
  created() {
    this.ratioInPercent = this.pageScaleRatio / 100
  },
  computed: {
    ...mapGetters({
      pageScaleRatio: 'getPageScaleRatio'
    })
  },
  methods: {
    ...mapMutations({
      _setScaleRatio: 'SET_pageScaleRatio'
    }),
    setScaleRatio (ratio: number) {
      this._setScaleRatio(ratio)
    }
  }
})
</script>

<style lang="scss" scoped>
.size-editor {
  display: grid;
  grid-template-rows: auto;
  grid-template-columns: auto auto auto;
  background-color: setColor(white);
  align-items: center;
  box-shadow: 0px 0px 5px setColor(gray-2, 0.3);
  padding: 7px 14px;
  border-radius: 7px;
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
</style>
