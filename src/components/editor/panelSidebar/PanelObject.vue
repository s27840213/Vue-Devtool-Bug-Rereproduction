<template lang="pug">
  div(class="panel-object")
    search-bar(class="mb-15"
      placeholder="Search objects"
      @search="handleSearch")
    div(class="panel-object__content")
      div(v-if="isDisplayByCategory")
        div(class="text-left")
          span(class="pointer" @click="handleSearch")
            svg-icon(iconName="chevron-left"
              iconWidth="20px")
        div(v-for="content in contents"
          :key="content.category_id"
          class="panel-object__items")
          category-object-item(v-for="item in content.list"
            class="panel-object__item"
            :key="item"
            :src="`${host}${item}/${preview}`"
            :objectId="item"
            @init="fetchJson")
      category-list(v-else
        :contents="contents"
        @action="handleAction")
        template(v-slot:item="{ item }")
          category-object-item(class="panel-object__item"
            :src="`${host}${item}/${preview}`"
            :objectId="item"
            @init="fetchJson")
      div(class="text-center")
        svg-icon(v-if="pending"
          :iconName="'loading'"
          :iconColor="'white'"
          :iconWidth="'20px'")
    //- observer-sentinel(v-if="hasNextPage"
    //-   target=".panel-object"
    //-   @callback="handleLoadMore")
</template>

<script lang="ts">
import Vue from 'vue'
import { mapGetters, mapState } from 'vuex'
import SearchBar from '@/components/SearchBar.vue'
import CategoryObjectItem from '@/components/category/CategoryObjectItem.vue'
import CategoryList from '@/components/category/CategoryList.vue'
import { IListServiceContentData } from '@/interfaces/api'

export default Vue.extend({
  components: {
    SearchBar,
    CategoryList,
    CategoryObjectItem
  },
  computed: {
    ...mapState(
      'objects',
      [
        'contents',
        'pending',
        'host',
        'json',
        'preview',
        'category'
      ]
    ),
    ...mapGetters('objects', ['hasNextPage']),
    isDisplayByCategory() {
      return typeof this.category === 'number'
    }
  },
  mounted() {
    this.$store.dispatch('objects/getContent')
  },
  methods: {
    handleAction(data: IListServiceContentData) {
      const { category_id: category } = data
      this.$store.dispatch('objects/getContent', { category })
    },
    handleSearch() {
      this.$store.dispatch('objects/getContent')
    },
    fetchJson(id: string) {
      this.$store.dispatch('objects/getContentJson', id)
    },
    handleLoadMore() {
      console.log('handleLoadMore')
    }
  }
})
</script>

<style lang="scss" scoped>
.panel-object {
  @include size(100%, 100%);
  display: flex;
  flex-direction: column;
  &__content {
    flex: 1;
    margin-right: -10px;
    overflow-y: scroll;
    overflow-x: hidden;
    scrollbar-width: thin;
    &::-webkit-scrollbar {
      width: 10px;
      height: 10px;
      background-color: unset;
    }
    &::-webkit-scrollbar-thumb {
      border-radius: 5px;
      visibility: hidden;
      background-color: #d9dbe1;
      border: 3px solid #2c2f43;
    }
    &:hover {
      &::-webkit-scrollbar-thumb {
        visibility: visible;
      }
    }
  }
  &__item {
    width: 80px;
    height: 80px;
    object-fit: contain;
    vertical-align: middle;
    margin: auto;
  }
  &__items {
    display: grid;
    grid-auto-rows: auto;
    grid-template-columns: repeat(3, 1fr);
    grid-gap: 10px;
  }
}
</style>
