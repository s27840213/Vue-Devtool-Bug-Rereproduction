<template lang="pug">
  div(class="sidebar")
    div(class="logo")
      svg-icon(class="pointer"
        :iconName="'logo-icon'"
        :iconWidth="'30px'"
        @click.native="goToPage('Home')")
    div(class="nav")
      div(class="nav-container")
        div(class="nav-item pointer"
          v-for="(item,index) in navItem" :key="`icon-${index}`"
          @click="switchNav(index)")
          svg-icon(class="nav-item__icon"
            :iconName="item.icon"
            :iconColor="(currPanel === index && !inBgRemoveMode) ? 'blue-1' : 'gray-3'"
            :iconWidth="'24px'")
          div(class="nav-item-text body-3"
            :class="(currPanel === index && !inBgRemoveMode) ? 'text-blue-1' : 'text-gray-3'") {{item.text}}
    div(class="sidebar__chevron pointer"
        :class="[{'rotate-hr': isSidebarPanelOpen}]"
        @click="toggleSidebarPanel")
      svg-icon(:iconName="'chevron-duo-right'"
        :iconColor="'gray-3'"
        :iconWidth="'30px'")
</template>
<script lang="ts">
import Vue from 'vue'
import { mapGetters, mapMutations, mapState } from 'vuex'
import { SidebarPanelType } from '@/store/types'
import pageUtils from '@/utils/pageUtils'
import Avatar from '@/components/Avatar.vue'

export default Vue.extend({
  components: {
    Avatar
  },
  props: {
    isSidebarPanelOpen: Boolean
  },
  data() {
    return {
      SidebarPanelType
    }
  },
  computed: {
    ...mapGetters({
      currPanel: 'getCurrSidebarPanelType',
      isShowPagePreview: 'page/getIsShowPagePreview',
      showPagePanel: 'page/getShowPagePanel',
      inBgRemoveMode: 'bgRemove/getInBgRemoveMode'
    }),
    navItem(): Array<{ icon: string, text: string }> {
      return [
        { icon: 'template', text: `${this.$tc('NN0001', 2)}` },
        { icon: 'photo', text: `${this.$tc('NN0002', 2)}` },
        { icon: 'shape', text: `${this.$tc('NN0003', 2)}` },
        { icon: 'bg', text: `${this.$tc('NN0004', 2)}` },
        { icon: 'text', text: `${this.$tc('NN0005', 2)}` },
        { icon: 'upload', text: `${this.$tc('NN0006')}` }
        // { icon: 'brand', text: `${this.$t('NN0007')}` },
        // { icon: 'photo', text: 'Pexels' }
      ]
    }
  },
  methods: {
    ...mapMutations({
      setCurrSidebarPanel: 'SET_currSidebarPanelType',
      _setIsShowPagePreview: 'page/SET_isShowPagePreview',
      _setShowPagePanel: 'page/SET_showPagePanel'
    }),
    switchNav(index: number): void {
      if (!this.inBgRemoveMode) {
        // switch to sidebar panel index
        this.setCurrSidebarPanel(index)
        this.$emit('toggleSidebarPanel', true)
        if (this.showPagePanel) {
          this._setShowPagePanel(false)
        }
        if (this.isShowPagePreview) {
          this._setIsShowPagePreview(false)
          pageUtils.jumpIntoPage(pageUtils.currFocusPageIndex)
        }
      }
    },
    goToPage(pageName: string) {
      if (!this.inBgRemoveMode) {
        this.$router.push({ name: pageName })
      }
    },
    toggleSidebarPanel() {
      if (!this.inBgRemoveMode) {
        if (this.showPagePanel) {
          this._setShowPagePanel(false)
        }
        this.$emit('toggleSidebarPanel', !this.isSidebarPanelOpen)
      }
    }
  }
})
</script>

<style lang="scss" scoped>
.sidebar {
  width: 75px;
  height: 100%;
  background-color: setColor(nav);
  display: grid;
  grid-template-rows: auto 1fr;
  grid-template-columns: 1fr;
  // box-shadow: 2px 0px 5px setColor(gray-4);
  z-index: setZindex(sidebar);
  &__chevron {
    @include flexCenter;
    padding: 10px;
    transition: transform 0.5s;
  }
}

.logo {
  padding: 20px 0px;
}

.nav {
  @include size(100%, 100%);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
  @include hide-scrollbar;
}
.nav-container {
  display: grid;
  grid-template-columns: 1fr;
  grid-auto-rows: auto;
  row-gap: 10px;
  width: 100%;
}
.nav-item {
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  box-sizing: border-box;
  transition: background-color 0.2s;
  padding: 5px;
  &__text {
    transition: color 0.2s;
  }
}
</style>
