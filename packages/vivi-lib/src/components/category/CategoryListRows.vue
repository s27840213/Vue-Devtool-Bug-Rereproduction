<template lang="pug">
div(class="category-list-rows")
  div(class="category-list-rows__header py-10 text-bold text-white")
    div
      link-or-text(:title="title" :url="url")
    div(class="category-list-rows__action pointer"
      @click="onAction(title)")
      slot(name="action") {{$t('NN0082')}}
  category-list-row(:gap="columnGap")
    div(v-for="item in list" :key="item.id")
      slot(name="preview" :item="item")
        img(:src="imagePreview")
</template>

<script lang="ts">
import LinkOrText from '@/components/LinkOrText.vue'
import { ICategoryItem } from '@/interfaces/api'
import CategoryListRow from './CategoryListRow.vue'
import { defineComponent, PropType } from 'vue'
import imagePreview from '@img/svg/image-preview.svg'

export default defineComponent({
  emits: ['action'],
  props: {
    list: {
      type: Array as PropType<ICategoryItem[]>,
      required: true
    },
    title: {
      type: String,
      required: true
    },
    url: {
      type: String,
      default: ''
    },
    columnGap: {
      type: Number,
      default: 10
    }
  },
  components: {
    CategoryListRow,
    LinkOrText,
  },
  data() {
    return {
      imagePreview
    }
  },
  methods: {
    onAction(title: string) {
      this.$emit('action', title)
    }
  }
})
</script>

<style lang="scss" scoped>
.category-list-rows {
  &__header {
    @include app(stk, cm) {
      @include body-MD;
    }
    line-height: 26px;
    display: flex;
    justify-content: space-between;
  }
  &__action {
    @include pic {
      &:hover {
        color: setColor(blue-1);
      }
    }
    @include app(stk, cm) {
      @include body-SM;
      &:active {
        color: setColor(black-5);
      }
    }
  }
}
</style>
