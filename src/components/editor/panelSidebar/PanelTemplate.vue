<template lang="pug">
  div(class="panel-template")
    search-bar(class="mb-15"
      placeholder="Search template"
      @search="handleSearch")
    div(v-if="emptyResultMessage") {{ emptyResultMessage }}
    div(v-else
      class="panel-template__content")
      div(v-if="isDisplayByCategory")
        div(class="text-left")
          span(class="pointer" @click="handleSearch")
            svg-icon(iconName="chevron-left"
              iconWidth="20px")
        div(v-for="content in contents"
          :key="content.category_id"
          class="panel-template__items")
          category-template-item(v-for="item in content.list"
            class="panel-template__item"
            :key="item"
            :src="`${host}/${item}/${preview}`"
            :objectId="item"
            @init="fetchJson")
      category-list(v-else
        :contents="contents"
        @action="handleAction")
        template(v-slot:item="{ item }")
          category-template-item(class="panel-template__item"
            :src="`${host}/${item}/${preview}`"
            :objectId="item"
            @init="fetchJson")
      //- observer-sentinel(v-if="hasNextPage"
      //-   target=".panel-template"
      //-   @callback="handleLoadMore")
      div(class="text-center")
        svg-icon(v-if="pending"
          :iconName="'loading'"
          :iconColor="'gray-2'"
          :iconWidth="'20px'")
</template>

<script lang="ts">
import Vue from 'vue'
import { mapGetters, mapState } from 'vuex'
import SearchBar from '@/components/SearchBar.vue'
import { IListServiceContentData } from '@/interfaces/api'
import CategoryList from '@/components/category/CategoryList.vue'
import CategoryListColumn from '@/components/category/CategoryListColumn.vue'
import CategoryTemplateItem from '@/components/category/CategoryTemplateItem.vue'

export default Vue.extend({
  components: {
    SearchBar,
    CategoryList,
    CategoryListColumn,
    CategoryTemplateItem
  },
  computed: {
    ...mapState(
      'templates',
      [
        'contents',
        'pending',
        'host',
        'json',
        'preview',
        'category'
      ]
    ),
    ...mapGetters('templates', ['hasNextPage', 'emptyResultMessage']),
    isDisplayByCategory () {
      return typeof this.category === 'number'
    }
  },
  mounted () {
    this.$store.dispatch('templates/getContent')
  },
  methods: {
    handleAction (data: IListServiceContentData) {
      const { category_id: category } = data
      this.$store.dispatch('templates/getContent', { category })
    },
    handleSearch () {
      this.$store.dispatch('templates/getContent')
    },
    fetchJson (id: string) {
      this.$store.dispatch('templates/getContentJson', id)
    },
    handleLoadMore () {
      console.log('handleLoadMore')
    }
  }
})
</script>

<style lang="scss" scoped>
.panel-template {
  @include size(100%, 100%);
  display: flex;
  flex-direction: column;
  &__content {
    flex: 1;
    overflow-y: scroll;
    &::-webkit-scrollbar {
      display: none;
    }
  }
  &__item {
    width: 135px;
    height: 135px;
    object-fit: contain;
    vertical-align: middle;
  }
  &__items {
    display: grid;
    grid-auto-rows: auto;
    grid-template-columns: repeat(2,1fr);
    grid-gap: 10px;
  }
}
</style>
