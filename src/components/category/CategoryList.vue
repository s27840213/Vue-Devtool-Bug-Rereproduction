<template lang="pug">
  div
    div(v-for="item in contents"
      :key="item.category_id"
      class="category-list")
      div(class="category-list__header py-10")
        div {{item.title}}
        slot(name="action")
          div(class="pointer"
            @click="onAction(item)") View all
      div(class="category-list__items")
        div(v-for="svg in item.list"
          :key="svg"
          class="category-list__item mr-10")
          slot(name="item" :item="svg")
            svg-icon(iconName="image-preview" iconWidth="80px")
</template>

<script lang="ts">
import Vue from 'vue'

export default Vue.extend({
  props: {
    contents: Array,
    host: String,
    preview: String
  },
  computed: {
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
    display: flex;
    justify-content: space-between;
  }
  &__items {
    display: flex;
    justify-content: flex-start;
    overflow: auto;
    margin-right: -20px;
    &::-webkit-scrollbar {
      display: none;
    }
  }
}
</style>
