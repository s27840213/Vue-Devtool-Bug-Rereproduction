<template lang="pug">
  div
    div(v-for="item in contents"
      :key="item.category_id"
      class="category-list mb-5")
      div(class="category-list__header py-10")
        div {{item.title}}
        div(class="category-list__action pointer"
          @click="onAction(item)")
          slot(name="action") View all
      component(:is="listName")
        div(v-for="svg in item.list" :key="svg")
          slot(name="item" :item="svg")
            img(:src="require('@/assets/img/svg/image-preview.svg')")
</template>

<script lang="ts">
import Vue from 'vue'
import CategoryListRow from './CategoryListRow.vue'
import CategoryListColumn from './CategoryListColumn.vue'

export default Vue.extend({
  props: {
    contents: Array,
    host: String,
    preview: String,
    columns: Boolean
  },
  components: {
    CategoryListRow,
    CategoryListColumn
  },
  computed: {
    listName () {
      return this.columns ? 'category-list-column' : 'category-list-row'
    }
  },
  methods: {
    onAction (item: any) {
      this.$emit('action', item)
    }
  }
})
</script>

<style lang="scss" scoped>
.category-list {
  &__header {
    line-height: 26px;
    display: flex;
    justify-content: space-between;
  }
  &__action {
    &:hover {
      color: #4EABE6;
    }
  }
}
</style>
