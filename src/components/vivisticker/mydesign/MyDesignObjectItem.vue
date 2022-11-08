<template lang="pug">
  div(class="my-design-object-item"
      @click="copySvg"
      v-press="copySvg")
    img(class="my-design-object-item__img"
      draggable="false"
      :src="src")
    //- pro-item(v-if="item.assetInfo.plan")
    div(v-if="isInSelectionMode"
        class="my-design-object-item__checkbox"
        :class="{checked: checkSelected()}"
        @click.prevent.stop="handleToggleDesignSelected")
      svg-icon(v-if="checkSelected()" iconName="check" iconColor="white" iconWidth="20.7px")
    div(v-else class="my-design-object-item__more" @click.stop.prevent="handleMoreActions")
      svg-icon(iconName="more" iconColor="white" iconWidth="24px")
</template>

<script lang="ts">
import Vue from 'vue'
import ProItem from '@/components/payment/ProItem.vue'
import vivistickerUtils from '@/utils/vivistickerUtils'
import { mapGetters, mapMutations } from 'vuex'
import editorUtils from '@/utils/editorUtils'
import generalUtils from '@/utils/generalUtils'

export default Vue.extend({
  components: {
    ProItem
  },
  props: {
    item: Object
  },
  computed: {
    ...mapGetters({
      isInSelectionMode: 'vivisticker/getIsInSelectionMode',
      selectedDesigns: 'vivisticker/getSelectedDesigns'
    }),
    src(): string {
      return vivistickerUtils.getThumbSrc('mydesign', this.item.id, this.item.ver)
    }
  },
  methods: {
    ...mapMutations({
      setMyDesignBuffer: 'vivisticker/SET_myDesignBuffer',
      selectDesign: 'vivisticker/UPDATE_selectDesign',
      deselectDesign: 'vivisticker/UPDATE_deselectDesign'
    }),
    checkSelected() {
      return this.selectedDesigns[this.item.id] !== undefined
    },
    copySvg() {
      if (this.isInSelectionMode) {
        this.handleToggleDesignSelected()
        return
      }
      if (this.item.assetInfo.isFrame) {
        console.log('frame cannot be copied')
      } else {
        const pages = generalUtils.deepCopy(this.item.pages)
        vivistickerUtils.sendScreenshotUrl(vivistickerUtils.createUrlForJSON(pages[0]))
      }
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
.my-design-object-item {
  position: relative;
  &__img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    vertical-align: middle;
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
    right: 2px;
    bottom: 2px;
    border-radius: 5px;
    background: rgba(24, 25, 31, 0.3);
    &:active {
      background: rgba(24, 25, 31, 0.6);
    }
    & > svg {
      opacity: 0.5;
    }
  }
}
</style>
