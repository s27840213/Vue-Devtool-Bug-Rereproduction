<template lang="pug">
  div(class="hashtag-row"
      :class="{'mobile': isMobile}")
    div(class="hashtag-row__title"
        :class="{'mobile': isMobile}") {{ list.title }}
    div(class="hashtag-row__tags"
        :class="{'mobile': isMobile}")
      div(class="hashtag-row__tags__tag"
          :class="{'selected': selected.length === 0, 'mobile': isMobile}"
          @click="handleSelectAll") 全部
      div(v-for="tag in list.list" class="hashtag-row__tags__tag"
          :class="{'mobile': isMobile, 'selected': checkSelection(tag)}"
          @click="handleSelect(tag)") {{ tag.name }}
</template>

<script lang="ts">
import Vue from 'vue'

export default Vue.extend({
  props: {
    list: Object,
    defaultSelection: Array,
    isMobile: Boolean
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
    styles(): {[key: string]: string} {
      return this.isMobile ? {
        width: 'fit-content',
        flexDirection: 'column',
        alignItems: 'start'
      } : {}
    },
    checkSelection(tag: any): boolean {
      const key: string = this.list.type === 'theme' ? tag.id.toString() : tag.name
      return this.selected.includes(key)
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
  &.mobile {
    flex-direction: column;
    align-items: start;
    width: calc(100% - 5px);
    overflow-x: auto;
    &::-webkit-scrollbar {
      display: none;
    }
    -ms-overflow-style: none;  /* IE and Edge */
    scrollbar-width: none;  /* Firefox */
  }
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
    &.mobile {
      margin-left: 0;
    }
  }
  &__tags {
    display: flex;
    align-items: center;
    gap: 18px 7px;
    flex-wrap: wrap;
    &.mobile {
      gap: 8px;
      flex-wrap: nowrap;
    }
    &__tag {
      background: white;
      border: 1px solid setColor(gray-5);
      height: 30px;
      line-height: 22px;
      box-sizing: border-box;
      border-radius: 100px;
      font-family: Mulish;
      font-weight: 400;
      font-size: 14px;
      color: setColor(gray-2);
      padding: 3px 10px;
      cursor: pointer;
      &.mobile {
        white-space: nowrap;
        padding: 3px 26px;
      }
      &.selected {
      background: setColor(blue-1);
      border: 1px solid setColor(blue-1);
        color: white;
      }
    }
  }
}
</style>
