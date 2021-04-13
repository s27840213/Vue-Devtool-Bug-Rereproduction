<template lang="pug">
  div(class="size-editor")
    svg-icon(class="pointer" :iconName="'minus-square'" :iconColor="'gray-2'" iconWidth="22px")
    div(class="size-editor__percentage")
      span(class="text-gray-2") {{pageScaleRatio}}%
    svg-icon(class="pointer" :iconName="'plus-square'" :iconColor="'gray-2'" iconWidth="22px")
</template>

<script lang="ts">
import Vue from 'vue'
import { mapGetters, mapMutations } from 'vuex'
export default Vue.extend({
  computed: {
    ...mapGetters({
      pageScaleRatio: 'editor/getPageScaleRatio'
    })
  },
  methods: {
    ...mapMutations
  }
})
</script>

<style lang="scss" scoped>
.size-editor {
  display: grid;
  grid-template-rows: auto;
  grid-template-columns: auto 60px auto;
  background-color: setColor(white);
  align-items: center;
  box-shadow: 0px 0px 5px setColor(gray-2, 0.3);
  padding: 7px 14px;
  border-radius: 7px;
  column-gap: 10px;
  &__percentage {
    border: 1px solid setColor(gray-2, 0.3);
    font-size: 12px;
    padding: 5px;
    border-radius: 3px;
  }
}
</style>
