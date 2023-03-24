<template lang="pug">
recycle-scroller(class="category-list" id="recycle" :items="list")
  template(v-slot="{ item }")
    observer-sentinel(v-if="item.sentinel"
      :key="`sentinel_${item.id}`"
      :target="`.category-list_${item.type}`"
      @callback="onLoadMore(item.moreType)")
    slot(:name="item.type" :key="item.id"
      :list="item.list"
      :title="item.title"
      :isFavorite="item.isFavorite")
  template(#before)
    slot(name="before")
  template(#after)
    slot(name="after")
</template>

<script lang="ts">
import ObserverSentinel from '@/components/ObserverSentinel.vue'
import { defineComponent, PropType } from 'vue'

const component = defineComponent({
  emits: ['loadMore'],
  props: {
    list: {
      type: Array as PropType<any[]>,
      default: () => []
    },
    rowSize: {
      type: Number,
      default: 3
    },
    rowHeight: {
      type: Number
    }
  },
  components: {
    ObserverSentinel
  },
  methods: {
    onLoadMore(moreType: string | undefined) {
      this.$emit('loadMore', moreType)
    }
  }
})
export default component
export type CCategoryList = InstanceType<typeof component>
</script>

<style lang="scss" scoped>
  .category-list {
    @include no-scrollbar;
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
