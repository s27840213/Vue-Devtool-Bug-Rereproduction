<template lang="pug">
  div(class="header-bar relative" @pointerdown.stop)
    div(class="header-bar__left")
      template(v-if="isInEditor")
      template(v-else-if="isInCategory")
        div(style="width: 24px; height: 24px" @click.prevent.stop="clearCategory")
          svg-icon(iconName="chevron-left" iconWidth="24px" iconColor="white")
      template(v-else)
        div(style="width: 20px; height: 20px")
          svg-icon(iconName="vivisticker_logo" iconWidth="20px" iconColor="white")
        div(style="width: 100px; height: 18px")
          svg-icon(iconName="vivisticker_title" iconWidth="100px" iconHeight="18px" iconColor="white")
    div(class="header-bar__center")
      template(v-if="isInCategory")
        span {{ keyword }}
    div(class="header-bar__right")
      template(v-if="isInEditor")
      template(v-else-if="isInCategory")
      template(v-else)
        div(class="header-bar__feature-icon" style="width: 24px; height: 24px")
          svg-icon(iconName="more" iconWidth="24px" iconColor="white")
</template>
<script lang="ts">
import Vue from 'vue'
import { mapActions, mapGetters, mapMutations, mapState } from 'vuex'

export default Vue.extend({
  data() {
    return {
    }
  },
  computed: {
    ...mapState('objects', {
      objectsKeyword: 'keyword'
    }),
    ...mapState('background', {
      backgroundKeyword: 'keyword'
    }),
    ...mapGetters({
      isInEditor: 'vivisticker/getIsInEditor',
      isInCategory: 'vivisticker/getIsInCategory',
      currActiveTab: 'vivisticker/getCurrActiveTab'
    }),
    keyword(): string {
      switch (this.currActiveTab) {
        case 'object':
          return this.objectsKeyword
        case 'background':
          return this.backgroundKeyword
      }
      return ''
    }
  },
  methods: {
    ...mapActions({
      resetObjects: 'objects/resetContent',
      refetchObjects: 'objects/getRecAndCate',
      resetBackgrounds: 'background/resetContent',
      refetchBackgrounds: 'background/getRecAndCate'
    }),
    ...mapMutations({
      setIsInCategory: 'vivisticker/SET_isInCategory'
    }),
    clearCategory() {
      this.setIsInCategory(false)
      switch (this.currActiveTab) {
        case 'object':
          this.resetObjects()
          this.refetchObjects()
          break
        case 'background':
          this.resetBackgrounds()
          this.refetchBackgrounds()
          break
      }
    }
  }
})
</script>

<style lang="scss" scoped>
.header-bar {
  @include size(100%, 44px);
  background-color: setColor(nav);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0px 24px;
  box-sizing: border-box;
  z-index: setZindex("editor-header");

  &__feature-icon {
    transition: background-color 0.1s;
    padding: 2px;
    border-radius: 3px;
    &:active {
      background-color: setColor(gray-2);
    }
  }

  &__left {
    display: flex;
    align-items: center;
    gap: 8px;
    & > div {
      display: flex;
      align-items: center;
      justify-content: center;
    }
  }

  &__center {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-weight: 600;
    font-size: 18px;
    line-height: 140%;
    color: white;
  }

  &__right {
    display: flex;
    align-items: center;
    justify-content: center;
  }
}
</style>
