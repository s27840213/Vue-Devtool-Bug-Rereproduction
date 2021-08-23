<template lang="pug">
  div(class="category-list-rows")
    div(class="category-list-rows__header py-10 text-bold text-white")
      div {{title}}
      div(class="category-list-rows__action pointer"
        @click="onAction(title)")
        slot(name="action") 更多
    category-list-row
      div(v-for="id in list" :key="id")
        slot(name="preview" :id="id")
          img(:src="require('@/assets/img/svg/image-preview.svg')")
</template>

<script lang="ts">
import Vue from 'vue'
import CategoryListRow from './CategoryListRow.vue'

export default Vue.extend({
  props: {
    list: Array,
    title: String
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
    line-height: 26px;
    display: flex;
    justify-content: space-between;
  }
  &__action {
    &:hover {
      color: #4eabe6;
    }
  }
}
</style>
