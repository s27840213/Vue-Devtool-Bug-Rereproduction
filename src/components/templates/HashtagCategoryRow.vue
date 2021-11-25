<template lang="pug">
  div(class="hashtag-row")
    div(class="hashtag-row__title") {{ list.title }}
    div(class="hashtag-row__tags")
      div(class="hashtag-row__tags__tag"
          :class="{'selected': selected.length === 0}"
          @click="handleSelectAll") All
      div(v-for="tag in list.list" class="hashtag-row__tags__tag"
          :class="checkSelection(tag)"
          @click="handleSelect(tag)") {{ tag.name }}
</template>

<script lang="ts">
import Vue from 'vue'

export default Vue.extend({
  props: {
    list: Object,
    defaultSelection: Array
  },
  mounted() {
    this.selected = this.defaultSelection as string[]
  },
  watch: {
    list() {
      this.selected = this.defaultSelection as string[]
    }
  },
  data() {
    return {
      selected: [] as string[]
    }
  },
  methods: {
    checkSelection(tag: any) {
      const key: string = this.list.type === 'theme' ? tag.id.toString() : tag.name
      return this.selected.includes(key) ? 'selected' : ''
    },
    handleSelectAll() {
      this.selected = []
      this.emitSelect()
    },
    handleSelect(tag: any) {
      const key: string = this.list.type === 'theme' ? tag.id.toString() : tag.name
      const index = this.selected.indexOf(key)
      if (index !== -1) {
        this.selected.splice(index, 1)
      } else {
        this.selected.push(key)
      }
      this.emitSelect()
    },
    emitSelect() {
      this.$emit('select', {
        title: this.list.title,
        selection: this.selected
      })
    }
  }
})
</script>

<style lang="scss" scoped>
.hashtag-row {
  display: flex;
  gap: 7px;
  margin-bottom: 16px;
  &__title {
    margin-top: 1px;
    margin-left: 8px;
    font-family: Mulish;
    font-weight: 700;
    font-size: 18px;
    line-height: 28px;
    text-align: center;
    color: setColor(blue-1);
    white-space: nowrap;
  }
  &__tags {
    display: flex;
    align-items: center;
    gap: 18px 7px;
    flex-wrap: wrap;
    &__tag {
      background: white;
      border: 1px solid setColor(gray-5);
      height: 30px;
      line-height: 22px;
      box-sizing: border-box;
      border-radius: 100px;
      font-family: Mulish;
      font-weight: 600;
      font-size: 14px;
      color: setColor(gray-2);
      padding: 3px 10px;
      cursor: pointer;
      &.selected {
      background: setColor(blue-1);
      border: 1px solid setColor(blue-1);
        color: white;
      }
    }
  }
}
</style>
