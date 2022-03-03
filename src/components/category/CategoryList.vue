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
  #recycle {// For overwrite vue-recycle setting
    overflow-y: overlay;
  }
  .category-list {
    margin-right: -10px; // Push scrollbar to outside
    padding-right: 10px;
    @include hide-scrollbar;
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
