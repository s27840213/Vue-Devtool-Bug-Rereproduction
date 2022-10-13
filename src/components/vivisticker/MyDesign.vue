<template lang="pug">
  div(class="my-design")
    div(class="my-design__tags")
      div(v-for="tag in tags" class="my-design__tag"
          :class="{ selected: checkTagSelected(tag) }"
          @click.prevent.stop="selectTag(tag)")
        span(class="my-design__tag-name") {{ tag.name }}
    div(class="my-design__content")
</template>

<script lang="ts">
import Vue from 'vue'
import { mapGetters, mapMutations } from 'vuex'

type Tag = {
  name: string,
  tab: string
}

export default Vue.extend({
  name: 'my-design',
  data() {
    return {
      tags: [{
        name: `${this.$t('NN0005')}`,
        tab: 'text'
      }, {
        name: `${this.$t('NN0003')}`,
        tab: 'object'
      }] as Tag[]
    }
  },
  computed: {
    ...mapGetters({
      MyDesignTab: 'vivisticker/getMyDesignTab'
    })
  },
  methods: {
    ...mapMutations({
      setMyDesignTab: 'vivisticker/SET_myDesignTab',
      setIsInSelectionMode: 'vivisticker/SET_isInSelectionMode'
    }),
    checkTagSelected(tag: Tag) {
      return this.MyDesignTab === tag.tab
    },
    selectTag(tag: Tag) {
      this.setMyDesignTab(tag.tab)
      this.setIsInSelectionMode(false)
    }
  }
})
</script>

<style lang="scss" scoped>
.my-design {
  position: relative;
  height: 100%;
  width: 100%;
  box-sizing: border-box;
  background-color: setColor(black-2);
  padding: 24px;
  display: grid;
  grid-template-rows: auto 1fr;

  &__tags {
    display: flex;
    align-items: center;
    justify-content: start;
    gap: 10px;
  }

  &__tag {
    background-color: setColor(black-3);
    padding: 8px;
    display: flex;
    align-content: center;
    justify-content: center;
    border-radius: 10px;
    &-name {
      @include body-SM;
      display: block;
      color: setColor(black-5);
    }
    &.selected {
      background-color: setColor(black-6);
      & > span {
        color: setColor(black-1);
      }
    }
  }

  &__content {
    width: 100%;
    height: 100%;
    overflow-y: scroll;
    @include no-scrollbar;
  }
}
</style>
