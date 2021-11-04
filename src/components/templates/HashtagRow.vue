<template lang="pug">
  div(class="hashtag-row")
    div(class="hashtag-row__title") {{ list.title }}
    div(class="hashtag-row__tags")
      div(class="hashtag-row__tags__tag"
          :class="{'selected': selected.length === 0}"
          @click="handleSelectAll") All
      div(v-for="tag in list.list" class="hashtag-row__tags__tag"
          :class="checkSelection(tag.name)"
          @click="handleSelect(tag.name)") {{ tag.name }}
</template>

<script lang="ts">
import Vue from 'vue'

export default Vue.extend({
  props: {
    list: Object
  },
  mounted() {
    this.selected = []
  },
  watch: {
    list() {
      this.selected = []
    }
  },
  data() {
    return {
      selected: [] as string[]
    }
  },
  methods: {
    checkSelection(name: string) {
      return this.selected.includes(name) ? 'selected' : ''
    },
    handleSelectAll() {
      this.selected = []
      this.emitSelect()
    },
    handleSelect(name: string) {
      const index = this.selected.indexOf(name)
      if (index !== -1) {
        this.selected.splice(index, 1)
      } else {
        this.selected.push(name)
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
