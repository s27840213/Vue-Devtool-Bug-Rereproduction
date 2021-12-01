<template lang="pug">
  recycle-scroller(class="category-list" id="recycle" :items="list")
    template(v-slot="{ item }")
      observer-sentinel(v-if="item.sentinel"
        :key="item.id"
        :target="`.category-list_${item.type}`"
        @callback="onLoadMore")
      slot(:name="item.type"
        :list="item.list"
        :title="item.title")
    template(#before)
      slot(name="before")
    template(#after)
      slot(name="after")
</template>

<script lang="ts">
import Vue, { PropType } from 'vue'
import ObserverSentinel from '@/components/ObserverSentinel.vue'

export default Vue.extend({
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
    onLoadMore() {
      this.$emit('loadMore')
    }
  }
})
</script>

<style lang="scss" scoped>
  #recycle {
    overflow-y: overlay;
  }
  .category-list {
    margin-right: -10px;
    padding-right: 10px;
    overflow-y: overlay;
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
