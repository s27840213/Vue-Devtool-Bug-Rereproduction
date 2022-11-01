<template lang="pug">
  div(class="my-design")
    div(class="my-design__tags")
      div(v-for="tag in tags" class="my-design__tag"
          :class="{ selected: checkTagSelected(tag) }"
          @click.prevent.stop="selectTag(tag)")
        span(class="my-design__tag-name") {{ tag.name }}
    div(class="my-design__content")
      category-list(:list="myDesignList")
        template(v-slot:my-design-object-item="{ list }")
          div(class="my-design__objects__items")
            my-design-object-item(v-for="item in list"
              class="my-design__objects__item"
              :key="item.id"
              :item="item")
</template>

<script lang="ts">
import Vue from 'vue'
import { mapGetters, mapMutations } from 'vuex'
import CategoryList from '@/components/category/CategoryList.vue'
import MyDesignObjectItem from '@/components/vivisticker/mydesign/MyDesignObjectItem.vue'
import { IMyDesign, IMyDesignTag } from '@/interfaces/vivisticker'
import vivistickerUtils from '@/utils/vivistickerUtils'
import editorUtils from '@/utils/editorUtils'

export default Vue.extend({
  name: 'my-design',
  data() {
    return {
      tags: vivistickerUtils.getMyDesignTags()
    }
  },
  components: {
    CategoryList,
    MyDesignObjectItem
  },
  mounted() {
    this.refreshDesigns(this.MyDesignTab)
  },
  computed: {
    ...mapGetters({
      isInMyDesign: 'vivisticker/getIsInMyDesign',
      MyDesignTab: 'vivisticker/getMyDesignTab',
      MyDesignFileList: 'vivisticker/getMyDesignFileList'
    }),
    list(): IMyDesign[] {
      return this.MyDesignFileList(this.MyDesignTab) as IMyDesign[]
    },
    myDesignList(): any[] {
      if (this.MyDesignTab !== 'object') {
        return []
      }
      const result = new Array(Math.ceil(this.list.length / 3))
        .fill('')
        .map((_, idx) => {
          const rowItems = this.list.slice(idx * 3, idx * 3 + 3)
          return {
            id: `result_${rowItems.map(item => item.id).join('_')}`,
            type: 'my-design-object-item',
            list: rowItems,
            size: 90,
            title: ''
          }
        })
      return result
    }
  },
  watch: {
    MyDesignTab(newVal) {
      this.refreshDesigns(newVal)
    },
    isInMyDesign(newVal) {
      if (newVal) {
        this.refreshDesigns(this.MyDesignTab)
      } else {
        editorUtils.setCloseMobilePanelFlag(true)
      }
    }
  },
  methods: {
    ...mapMutations({
      setMyDesignTab: 'vivisticker/SET_myDesignTab',
      setIsInSelectionMode: 'vivisticker/SET_isInSelectionMode'
    }),
    refreshDesigns(tab: string) {
      vivistickerUtils.listAsset(`mydesign-${tab}`)
    },
    checkTagSelected(tag: IMyDesignTag) {
      return this.MyDesignTab === tag.tab
    },
    selectTag(tag: IMyDesignTag) {
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
  gap: 24px;

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

  &__objects {
    &__item {
      width: 80px;
      height: 80px;
      margin: 0 auto;
    }
    &__items {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
    }
  }
}
</style>
