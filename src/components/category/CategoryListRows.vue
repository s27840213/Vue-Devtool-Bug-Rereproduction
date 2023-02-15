<template lang="pug">
div(class="category-list-rows")
  div(class="category-list-rows__header py-10 text-white")
    div {{title}}
    div(class="category-list-rows__action pointer"
      @click="onAction(title)")
      slot(name="action") {{$t('NN0082')}}
  category-list-row
    div(v-for="item in list" :key="item.id")
      slot(name="preview" :item="item")
        img(:src="require('@/assets/img/svg/image-preview.svg')")
</template>

<script lang="ts">
import Vue from 'vue'
import CategoryListRow from './CategoryListRow.vue'

export default Vue.extend({
  props: {
    list: Array,
    title: String,
    isFavorite: Boolean
  },
  components: {
    CategoryListRow
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
    @include body-MD;
    line-height: 26px;
    display: flex;
    justify-content: space-between;
  }
  &__action {
    @include body-SM;
    &:active {
      color: setColor(black-5);
    }
  }
}
</style>
