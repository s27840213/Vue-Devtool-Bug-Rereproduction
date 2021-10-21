<template lang="pug">
  div(class="my-design")
    nu-header
    div(class="my-design__content")
      sidebar
      section(class="my-design__design-view")
        transition(name="slide-down-fade")
          div(v-if="isMultiSelected" class="my-design__multi")
            div(class="my-design__multi__container")
              div(class="my-design__multi__number")
                span {{ `選取 ${selectedNum}` }}
              div(class="my-design__multi__actions")
                div(class="my-design__multi__icon"
                    @click="toggleAllFavorite")
                  svg-icon(iconName="heart"
                          iconWidth="21px"
                          iconColor="gray-2")
                div(class="my-design__multi__icon")
                  svg-icon(iconName="folder"
                          iconWidth="21px"
                          iconColor="gray-2")
                div(class="my-design__multi__icon"
                    @click="deleteAll")
                  svg-icon(iconName="trash"
                          iconWidth="21px"
                          iconColor="gray-2")
              div(class="my-design__multi__close"
                  @click="handleClearSelection")
                svg-icon(iconName="close-large"
                        iconWidth="11px"
                        iconHeight="13px"
                        iconColor="gray-2")
        component(:is="mydesignView"
                  class="design-view"
                  :selectedDesigns="selectedDesigns"
                  @deleteDesign="handleDeleteDesign"
                  @selectDesign="handleSelectDesign"
                  @deselectDesign="handleDeselectDesign"
                  @clearSelection="handleClearSelection"
                  @recoverDesign="handleRecoverDesign")
        transition(name="slide-fade")
          div(v-if="isShowMessage" class="my-design__message")
            div(class="my-design__message__img" :style="messageImageStyles()")
            div(class="my-design__message__text")
              span 設計已移至垃圾桶
            div(class="my-design__message__button" @click="recover")
              span 復原
    transition(name="scale-fade")
      div(v-if="isShowDeleteAllMessage" class="dim-background" @click="closeDeleteAllMessage")
        div(class="delete-all-message")
          div(class="delete-all-message__img")
            img(:src="require('@/assets/img/png/mydesign/delete-confirm.png')" width="55px" height="57px")
          div(class="delete-all-message__text")
            span 確定要刪除這些設計？
          div(class="delete-all-message__buttons")
            div(class="delete-all-message__cancel" @click="closeDeleteAllMessage")
              span 取 消
            div(class="delete-all-message__confirm" @click="deleteAllConfirmed")
              span 刪 除
</template>

<script lang="ts">
import Vue from 'vue'
import { mapGetters } from 'vuex'
import Sidebar from '@/components/navigation/mydesign/Sidebar.vue'
import NuHeader from '@/components/NuHeader.vue'
import AllDesignView from '@/components/navigation/mydesign/design-views/AllDesignView.vue'
import FavoriteDesignView from '@/components/navigation/mydesign/design-views/FavoriteDesignView.vue'
import TrashDesignView from '@/components/navigation/mydesign/design-views/TrashDesignView.vue'
import FolderDesignView from '@/components/navigation/mydesign/design-views/FolderDesignView.vue'
import { IDesign, IPathedDesign } from '@/interfaces/design'
import designUtils from '@/utils/designUtils'

export default Vue.extend({
  name: 'MyDesgin',
  components: {
    Sidebar,
    NuHeader,
    AllDesignView,
    FavoriteDesignView,
    TrashDesignView,
    FolderDesignView
  },
  data() {
    return {
      deletedDesignThumbnail: require('@/assets/img/svg/frame.svg'),
      deletedDesignQueue: [] as IDesign[],
      waitingRecovery: '',
      messageTimer: -1,
      isShowMessage: false,
      selectedDesigns: {} as {[key: string]: IPathedDesign},
      isShowDeleteAllMessage: false
    }
  },
  computed: {
    ...mapGetters('design', {
      currentSelectedFolder: 'getCurrSelectedFolder'
    }),
    mydesignView(): string {
      switch (this.currentSelectedFolder[0]) {
        case 'a':
          return 'all-design-view'
        case 'h':
          return 'favorite-design-view'
        case 't':
          return 'trash-design-view'
        case 'f':
          return 'folder-design-view'
        default:
          return 'all-design-view'
      }
    },
    selectedNum(): number {
      return Object.keys(this.selectedDesigns).length
    },
    isMultiSelected(): boolean {
      return this.selectedNum > 1
    }
  },
  watch: {
    currentSelectedFolder() {
      this.handleClearSelection()
    }
  },
  methods: {
    messageImageStyles() {
      return { 'background-image': `url(${this.deletedDesignThumbnail})` }
    },
    showDeletionMessage() {
      const design = this.deletedDesignQueue[0]
      if (design) {
        this.deletedDesignThumbnail = design.thumbnail
        this.waitingRecovery = design.id
        this.isShowMessage = true
        this.messageTimer = setTimeout(() => {
          this.isShowMessage = false
          setTimeout(() => {
            this.deletedDesignQueue.shift()
            this.showDeletionMessage()
          }, 1000)
        }, 5000)
      }
    },
    handleDeleteDesign(design: IDesign) {
      this.deletedDesignQueue.push(design)
      if (this.deletedDesignQueue.length === 1) {
        this.showDeletionMessage()
      }
    },
    handleSelectDesign(pathedDesign: IPathedDesign) {
      this.$set(this.selectedDesigns, pathedDesign.design.id, pathedDesign)
    },
    handleDeselectDesign(pathedDesign: IPathedDesign) {
      this.$delete(this.selectedDesigns, pathedDesign.design.id)
    },
    handleClearSelection() {
      this.selectedDesigns = {}
    },
    handleRecoverDesign(design: IDesign) {
      if (design.id === this.waitingRecovery) {
        clearTimeout(this.messageTimer)
        this.isShowMessage = false
        setTimeout(() => {
          this.deletedDesignQueue.shift()
          this.showDeletionMessage()
        }, 500)
      }
    },
    recover() {
      clearTimeout(this.messageTimer)
      designUtils.recover(this.waitingRecovery)
      this.isShowMessage = false
      setTimeout(() => {
        this.deletedDesignQueue.shift()
        this.showDeletionMessage()
      }, 500)
    },
    toggleAllFavorite() {
      if (designUtils.checkAllInFavorite(Object.values(this.selectedDesigns))) {
        designUtils.removeAllFromFavorite(Object.values(this.selectedDesigns))
      } else {
        designUtils.addAllToFavorite(Object.values(this.selectedDesigns))
      }
    },
    deleteAll() {
      this.isShowDeleteAllMessage = true
    },
    deleteAllConfirmed() {
      designUtils.deleteAll(Object.values(this.selectedDesigns))
    },
    closeDeleteAllMessage() {
      this.isShowDeleteAllMessage = false
    }
  }
})
</script>

<style lang="scss" scoped>
.my-design {
  @include size(100%, 100%);
  max-height: 100%;
  &__content {
    position: relative;
    height: calc(100% - 50px);
    display: grid;
    grid-template-rows: minmax(0, 1fr);
    grid-template-columns: auto 1fr;
  }
  &__design-view {
    position: relative;
  }
  &__multi {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 55px;
    background-color: setColor(gray-6);
    box-shadow: 0px 5px 12px rgba(0, 0, 0, 0.25);
    box-sizing: border-box;
    &__container {
      position: relative;
      @include size(100%, 100%);
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding-left: 118px;
      padding-right: 154.72px;
      box-sizing: border-box;
    }
    &__number {
      height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      > span {
        font-family: Mulish;
        font-weight: 700;
        font-size: 14px;
        line-height: 20px;
        color: setColor(gray-2);
      }
    }
    &__actions {
      position: absolute;
      left: 50%;
      transform: translateX(-50%);
      width: 129px;
      height: 21px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    &__icon {
      width: 21px;
      height: 21px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
    }
    &__close {
      width: 11px;
      height: 13px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
    }
  }
  &__message {
    position: absolute;
    left: 50%;
    top: 27px;
    transform: translateX(-50%);
    height: 49px;
    display: flex;
    align-items: center;
    gap: 14px;
    padding-left: 8px;
    padding-right: 10px;
    background-color: #373B53;
    border-radius: 10px;
    &__img {
      width: 32px;
      height: 32px;
      border-radius: 5px;
      background-size: cover;
      background-position: center center;
    }
    &__text {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 25px;
      > span {
        font-family: NotoSansTC;
        font-weight: 400;
        font-size: 16px;
        line-height: 25px;
        color: white;
        letter-spacing: 0.205em;
      }
    }
    &__button {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 80px;
      height: 25px;
      background-color: setColor(blue-3);
      border-radius: 18px;
      > span {
        font-family: NotoSansTC;
        font-weight: 700;
        font-size: 16px;
        line-height: 25px;
        color: setColor(gray-2);
        letter-spacing: 0.205em;
      }
    }
  }
}

.design-view {
  height: 100%;
  width: 100%
}

.dim-background {
  @include size(125%, 125%);
  position: fixed;
  top: -12.5%;
  left: -12.5%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(24, 25, 31, 0.7);
  z-index: 1000;
}

.delete-all-message {
  width: 243px;
  height: 158px;
  background-color: white;
  box-shadow: 0px 0px 12px rgba(151, 150, 150, 0.4);
  border-radius: 2px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  &__img {
    height: 57px;
  }
  &__text {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 26px;
    > span {
      font-family: NotoSansTC;
      font-weight: 700;
      font-size: 14px;
      line-height: 26px;
      color: setColor(gray-2);
    }
  }
  &__buttons {
    margin-top: 8px;
    width: 137px;
    height: 25px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    > div {
      width: 63.39px;
      height: 25px;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      > span {
        font-family: NotoSansTC;
        font-weight: 400;
        font-size: 12px;
        line-height: 25px;
      }
    }
  }
  &__cancel {
    background-color: setColor(gray-4);
    &:hover {
      background-color: setColor(red-2);
      > span {
        color: white;
      }
      & ~ .delete-all-message__confirm {
        background-color: setColor(gray-4);
        > span {
          color: white;
        }
      }
    }
    > span {
      color: black;
    }
  }
  &__confirm {
    background-color: setColor(red-1);
    &:hover {
      background-color: setColor(red-2);
    }
    > span {
      color: white;
    }
  }
}

.slide-fade-enter-active {
  transition: .3s ease;
}

.slide-fade-leave-active {
  transition: .5s ease;
}

.slide-fade-enter, .slide-fade-leave-to {
  top: 17px;
  opacity: 0;
}

.slide-down-fade-enter-active, .slide-down-fade-leave-active {
  transition: .2s;
}

.slide-down-fade-enter, .slide-down-fade-leave-to {
  top: -55px;
  opacity: 0;
}

.scale-fade-enter-active, .scale-fade-leave-active {
  transition: .05s;
}

.scale-fade-enter, .scale-fade-leave-to {
  opacity: 0;
  transform: scale(0.8);
}
</style>
