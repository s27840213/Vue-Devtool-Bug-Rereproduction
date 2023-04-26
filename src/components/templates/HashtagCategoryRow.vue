<template lang="pug">
div(class="hashtag-row")
  div(v-if="title" class="hashtag-row__title") {{ title }}
  div(class="hashtag-row__tags")
    div(class="hashtag-row__tags__tag"
        :class="{'selected': selected.length === 0}"
        @click="handleSelectAll") {{ $t('NN0324') }}
    div(v-for="(tag,idx) in list"
      :key="idx"
      class="hashtag-row__tags__tag"
      :class="{'selected': checkSelection(tag)}"
      @click="handleSelect(tag)") {{ tag.name }}
</template>

<script lang="ts">
import { PropType, defineComponent } from 'vue'

export default defineComponent({
  props: {
    defaultSelection: {
      type: Array,
      required: true
    },
    type: {
      type: String,
      required: true
    },
    list: {
      type: Array as PropType<{ name: string }[]>,
      required: true
    },
    title: {
      type: String,
      default: ''
    }
  },
  mounted() {
    this.selected = this.defaultSelection as string[]
  },
  watch: {
    list() {
      this.selected = this.defaultSelection as string[]
    },
    defaultSelection() {
      this.selected = this.defaultSelection as string[]
    }
  },
  data() {
    return {
      selected: [] as string[]
    }
  },
  methods: {
    checkSelection(tag: any): boolean {
      const key: string = this.type === 'theme' ? tag.id.toString() : tag.name
      return this.selected.includes(key)
    },
    handleSelectAll() {
      this.selected = []
      this.emitSelect()
    },
    handleSelect(tag: any) {
      const key: string = this.type === 'theme' ? tag.id.toString() : tag.name
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
        title: this.title,
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
  @media screen and (max-width: 540px) {
    flex-direction: column;
    align-items: start;
    width: calc(100% - 5px);
    overflow-x: auto;
    @include no-scrollbar;
  }
  &__title {
    margin-top: 1px;
    margin-left: 8px;
    font-weight: 700;
    font-size: 18px;
    line-height: 28px;
    text-align: center;
    color: setColor(blue-1);
    white-space: nowrap;
    @media screen and (max-width: 540px) {
      margin-left: 0;
    }
  }
  &__tags {
    display: flex;
    align-items: center;
    gap: 18px 7px;
    flex-wrap: wrap;
    @media screen and (max-width: 540px) {
      gap: 8px;
      flex-wrap: nowrap;
    }
    &__tag {
      background: white;
      border: 1px solid setColor(gray-5);
      height: 30px;
      box-sizing: border-box;
      border-radius: 100px;
      color: setColor(gray-2);
      padding: 3px 10px;
      cursor: pointer;
      @include body-SM;
      line-height: 20px;
      @media screen and (max-width: 540px) {
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
