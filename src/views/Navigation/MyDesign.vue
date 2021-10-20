<template lang="pug">
  div(class="my-design")
    nu-header
    div(class="my-design__content")
      sidebar
      section(class="relative")
        component(:is="mydesignView"
                  class="design-view"
                  @deleteDesign="handleDeleteDesign")
        transition(name="slide-fade")
          div(v-if="isShowMessage" class="my-design__message")
            div(class="my-design__message__img" :style="messageImageStyles()")
            div(class="my-design__message__text")
              span 設計已移至垃圾桶
            div(class="my-design__message__button" @click="recover")
              span 復原
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
import { IDesign } from '@/interfaces/design'
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
      isShowMessage: false
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
    recover() {
      clearTimeout(this.messageTimer)
      designUtils.recover(this.waitingRecovery)
      this.isShowMessage = false
      this.deletedDesignQueue.shift()
      this.showDeletionMessage()
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
</style>
