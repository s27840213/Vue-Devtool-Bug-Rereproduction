<template lang="pug">
  div(class="panel-object")
    search-bar(@search="handleSearch")
    div(v-if="isDisplayByCategory")
      div(v-for="content in contents"
        :key="content.category_id"
        class="panel-object__items")
        category-item(v-for="item in content.list"
          class="panel-object__item"
          :key="item"
          :src="`${host}${item}/${preview}`"
          :objectId="item"
          @init="fetchJson")
    category-list(v-else
      :contents="contents"
      @action="handleAction")
      template(v-slot:item="{ item }")
        category-item(class="panel-object__item"
          :src="`${host}${item}/${preview}`"
          :objectId="item"
          @init="fetchJson")
    div(class="text-center")
      svg-icon(v-if="pending"
        :iconName="'loading'"
        :iconColor="'gray-2'"
        :iconWidth="'20px'")
</template>

<script lang="ts">
import Vue from 'vue'
import { mapState } from 'vuex'
import SearchBar from '@/components/SearchBar.vue'
import CategoryItem from '@/components/category/CategoryItem.vue'
import CategoryList from '@/components/category/CategoryList.vue'

export default Vue.extend({
  components: {
    SearchBar,
    CategoryList,
    CategoryItem
  },
  computed: {
    ...mapState(
      'objects',
      ['contents', 'pending', 'host', 'json', 'preview', 'category']
    ),
    isDisplayByCategory () {
      return typeof this.category === 'number'
    }
  },
  mounted () {
    this.$store.dispatch('objects/getObjects')
  },
  methods: {
    handleAction (data: any) {
      this.$store.dispatch('objects/getCategoryObjects', data.category_id)
    },
    handleSearch () {
      this.$store.dispatch('objects/getObjects')
    },
    fetchJson (id: string) {
      this.$store.dispatch('objects/getContentJson', id)
    }
  }
})
</script>

<style lang="scss" scoped>
.panel-object {
  @include size(100%, 100%);
  &__item {
    width: 80px;
    height: 80px;
    object-fit: contain;
  }
  &__items {
    display: grid;
    grid-auto-rows: auto;
    grid-template-columns: repeat(3,1fr);
    row-gap: 10px;
    column-gap: 10px;
    margin-top: 20px;
  }
}
</style>
