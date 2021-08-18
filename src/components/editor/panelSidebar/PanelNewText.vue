<template lang="pug">
  div(class="panel-text")
    div(class="panel-text__title mb-15")
      span(class="text-blue-1 label-lg") Text
    div(class="panel-text__content")
      div(class="panel-text__buttons mb-10")
        btn(class="full-width mb-10"
          :type="'text-heading'"
          draggable="true"
          @dragstart="dragStart($event, 'heading')"
          @click.native="handleAddText('heading')") Heading
        btn(class="full-width mb-10"
          :type="'text-subheading'"
          draggable="true"
          @dragstart="dragStart($event, 'subheading')"
          @click.native="handleAddText('subheading')") Subheading
        btn(class="full-width"
          :type="'text-body'"
          draggable="true"
          @dragstart="dragStart($event, 'body')"
          @click.native="handleAddText('body')") Body
      div(v-for="content in contents"
        :key="content.category_id"
        class="panel-text__items")
        category-text-item(v-for="item in content.list"
          class="panel-text__item"
          :key="item"
          :src="`${host}/${item}/${preview}`"
          :objectId="item"
          @init="fetchJson")
      //- observer-sentinel(v-if="hasNextPage"
      //-   target=".panel-text"
      //-   @callback="handleLoadMore")
      div(class="text-center")
        svg-icon(v-if="pending"
          :iconName="'loading'"
          :iconColor="'white'"
          :iconWidth="'20px'")
</template>

<script lang="ts">
import Vue from 'vue'
import { mapGetters, mapState } from 'vuex'
import SearchBar from '@/components/SearchBar.vue'
import { IListServiceContentData } from '@/interfaces/api'
import CategoryList from '@/components/category/CategoryList.vue'
import CategoryListColumn from '@/components/category/CategoryListColumn.vue'
import CategoryTextItem from '@/components/category/CategoryTextItem.vue'
import TextUtils from '@/utils/textUtils'

export default Vue.extend({
  components: {
    SearchBar,
    CategoryList,
    CategoryListColumn,
    CategoryTextItem
  },
  computed: {
    ...mapState(
      'textStock',
      [
        'contents',
        'pending',
        'host',
        'json',
        'preview',
        'category'
      ]
    ),
    ...mapGetters('textStock', ['hasNextPage', 'emptyResultMessage']),
    ...mapGetters({ scaleRatio: 'getPageScaleRatio' }),
    isDisplayByCategory () {
      return typeof this.category === 'number'
    }
  },
  mounted () {
    this.$store.dispatch('textStock/getContent', { category: 0 })
  },
  methods: {
    dragStart(event: DragEvent, type: string) {
      console.log('xxx')
      const dataTransfer = event.dataTransfer as DataTransfer
      dataTransfer.dropEffect = 'move'
      dataTransfer.effectAllowed = 'move'

      const rect = (event.target as Element).getBoundingClientRect()
      const x = (event.clientX - rect.x) * (this.scaleRatio / 100)
      const y = (event.clientY - rect.y) * (this.scaleRatio / 100)

      import(`@/assets/json/${type}.json`)
        .then(json => {
          const fieldMap = {
            heading: 'isHeading',
            subheading: 'isSubheading',
            body: 'isBody'
          } as { [key: string]: string }
          const field = fieldMap[type]

          json.field = field
          Object.assign(json.styles, { x, y })
          console.log(json)
          dataTransfer.setData('data', JSON.stringify(json))
        })
        .catch(() => {
          console.log('Cannot find the file')
        })
    },
    handleAction (data: IListServiceContentData) {
      const { category_id: category } = data
      this.$store.dispatch('textStock/getContent', { category })
    },
    fetchJson (id: string) {
      this.$store.dispatch('textStock/getContentJson', id)
    },
    handleLoadMore () {
      console.log('handleLoadMore')
    },
    handleAddText (type: string) {
      TextUtils.addStanardText(type)
    }
  }
})
</script>

<style lang="scss" scoped>
.panel-text {
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
