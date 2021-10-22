<template lang="pug">
  div(class="folder-item")
    div(class="folder-item__block"
        :class="isMouseOver ? 'block-over' : 'block'"
        v-on="undroppable ? {} : { dragenter: handleMouseEnter, dragleave: handleMouseLeave }"
        @mouseenter="handleMouseEnter"
        @mouseleave="handleMouseLeave"
        @dragover.prevent
        @drop="handleDrop"
        @click="emitGoto")
      svg-icon(style="pointer-events: none"
              iconName="folder"
              iconWidth="24px"
              iconColor="gray-2")
    div(class="folder-item__name")
      span {{ name }}
</template>

<script lang="ts">
import designUtils from '@/utils/designUtils'
import Vue from 'vue'
import { mapGetters } from 'vuex'

export default Vue.extend({
  props: {
    path: Array,
    name: String,
    undroppable: Boolean
  },
  data() {
    return {
      isMouseOver: false
    }
  },
  computed: {
    ...mapGetters('design', {
      draggingDesign: 'getDraggingDesign',
      selectedDesigns: 'getSelectedDesigns'
    }),
    selectedNum(): number {
      return Object.keys(this.selectedDesigns).length
    },
    isMultiSelected(): boolean {
      return this.selectedNum > 1
    }
  },
  methods: {
    emitGoto() {
      this.$emit('goto')
    },
    handleMouseEnter() {
      this.isMouseOver = true
    },
    handleMouseLeave() {
      this.isMouseOver = false
    },
    handleDrop() {
      this.isMouseOver = false
      if (this.undroppable) return
      const { path = [], id = '' } = this.draggingDesign ?? {}
      if (id === '') return
      if (this.isMultiSelected && this.selectedDesigns[id]) {
        designUtils.moveAll(Object.values(this.selectedDesigns), [...(this.path as string[]), this.name as string])
      } else {
        designUtils.move(id, path, [...(this.path as string[]), this.name as string])
      }
    }
  }
})
</script>

<style lang="scss" scoped>
.folder-item {
  &__block {
    width: 63px;
    height: 63px;
    margin-bottom: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
    border-radius: 4px;
    cursor: pointer;
  }
  &__name {
    width: 63px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    > span {
      font-family: Mulish;
      font-size: 14px;
      font-weight: 400;
      color: setColor(gray-1);
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow-wrap: break-word;
      word-break: break-all;
      overflow: hidden;
    }
  }
}

.block {
  border: 1px solid setColor(gray-4);
}

.block-over {
  border: none;
  background-color: setColor(gray-5);
}
</style>
