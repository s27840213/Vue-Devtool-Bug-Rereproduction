<template lang="pug">
div(class="my-design-text-item" @click="editTemplate")
  img(class="my-design-text-item__img"
    draggable="false"
    :src="src"
    :style="imgStyles()")
  div(v-if="isInSelectionMode"
      class="my-design-text-item__checkbox"
      :class="{checked: checkSelected()}"
      @click.prevent.stop="handleToggleDesignSelected")
    svg-icon(v-if="checkSelected()" iconName="check" iconColor="white" iconWidth="20.7px")
  div(v-else class="my-design-text-item__more" @click.stop.prevent="handleMoreActions")
    svg-icon(iconName="more" iconColor="white" iconWidth="24px")
  div(v-if="item.assetInfo.pageNum" class="my-design-text-item__index")
    svg-icon(iconName="pages" iconColor="black-5" iconWidth="20px")
    div(class="my-design-text-item__index__text")
      span(class="text-black-5 body-XS") {{ strPageIndex }}
</template>

<script lang="ts">
import { IMyDesign } from '@/interfaces/vivisticker'
import editorUtils from '@/utils/editorUtils'
import vivistickerUtils from '@/utils/vivistickerUtils'
import { defineComponent, PropType } from 'vue'
import { mapGetters, mapMutations } from 'vuex'

export default defineComponent({
  props: {
    item: {
      type: Object as PropType<IMyDesign>,
      required: true
    }
  },
  computed: {
    ...mapGetters({
      isInSelectionMode: 'vivisticker/getIsInSelectionMode',
      selectedDesigns: 'vivisticker/getSelectedDesigns'
    }),
    src(): string {
      return vivistickerUtils.getThumbSrc('mydesign', this.item.id, this.item.ver)
    },
    strPageIndex(): string {
      return `${this.item.assetInfo.pageNum}`
    }
  },
  methods: {
    ...mapMutations({
      setMyDesignBuffer: 'vivisticker/SET_myDesignBuffer',
      selectDesign: 'vivisticker/UPDATE_selectDesign',
      deselectDesign: 'vivisticker/UPDATE_deselectDesign'
    }),
    imgStyles(): {[key: string]: string} {
      return this.item.type === 'story' ? {
        height: 'calc(100% - 25px)',
        marginTop: '8px'
      } : {
        width: 'calc(100% - 40px)',
        height: 'calc(100% - 40px)',
        margin: '20px',
      }
    },
    checkSelected() {
      return this.selectedDesigns[this.item.id] !== undefined
    },
    editTemplate() {
      if (this.isInSelectionMode) {
        this.handleToggleDesignSelected()
        return
      }
      vivistickerUtils.initWithMyDesign(this.item, {
        // TODO: handle Dialog and File-selector for frames
        // callback: (pages: Array<IPage>) => {
        //   pages.forEach((page: IPage) => {
        //     page.layers.forEach(l => {
        //       l.initFromMydesign = true
        //     })
        //     vivistickerUtils.initLoadingFlags(page, () => {
        //       vivistickerUtils.handleFrameClipError(page, true)
        //     })
        //   })
        // }
      })
    },
    handleMoreActions() {
      this.setMyDesignBuffer(this.item)
      editorUtils.setCurrActivePanel('my-design-more')
      editorUtils.setShowMobilePanel(true)
    },
    handleToggleDesignSelected() {
      if (this.checkSelected()) {
        this.deselectDesign(this.item)
      } else {
        this.selectDesign(this.item)
      }
    }
  }
})
</script>

<style lang="scss" scoped>
.my-design-text-item {
  position: relative;
  background: rgba(255, 255, 255, 0.1);
  box-shadow: 0px 0px 8px rgba(60, 60, 60, 0.31);
  border-radius: 10px;
  &__img {
    object-fit: contain;
    object-position: center;
    border-radius: 5px;
    -webkit-touch-callout: none;
    user-select: none;
  }
  &__checkbox {
    @include size(20px);
    position: absolute;
    top: 4px;
    right: 4px;
    background: setColor(gray-6);
    border: 1px solid setColor(black-5);
    border-radius: 50%;
    box-sizing: border-box;
    display: flex;
    justify-content: center;
    align-items: center;
    &.checked {
      background: setColor(black-3);
      border: none;
    }
  }
  &__more {
    @include size(24px);
    display: flex;
    align-items: center;
    justify-content: center;
    position: absolute;
    right: 4px;
    bottom: 4px;
    border-radius: 5px;
    background: rgba(24, 25, 31, 0.3);
    &:active {
      background: rgba(24, 25, 31, 0.6);
    }
    & > svg {
      opacity: 0.5;
    }
  }
  &__index {
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;
    padding: 4px 4px 4px 8px;
    position: absolute;
    width: 40px;
    height: 16px;
    left: 4px;
    bottom: 4px;
    background: rgba(setColor(gray-1), 0.3);
    border-radius: 100px;
    &__text {
      width: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
  }
}
</style>
