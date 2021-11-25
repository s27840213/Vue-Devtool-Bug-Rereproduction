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
            :iconColor="currPanel === index ? 'blue-1' : 'gray-3'"
            :iconWidth="'24px'")
          div(class="nav-item-text body-3"
            :class="currPanel === index ? 'text-blue-1' : 'text-gray-3'") {{item.text}}
    div(class="sidebar__chevron pointer"
        :class="[{'rotate-hr': isSidebarPanelOpen}]"
        @click="toggleSidebarPanel")
      svg-icon(:iconName="'chevron-duo-right'"
        :iconColor="'gray-3'"
        :iconWidth="'30px'")
    div(class="nav-setting pointer")
      div(class="profile pointer text-white text-body-2")
        span {{shortName}}
</template>
<script lang="ts">
import Vue from 'vue'
import { mapGetters, mapMutations, mapState } from 'vuex'
import { SidebarPanelType } from '@/store/types'
import pageUtils from '@/utils/pageUtils'

export default Vue.extend({
  components: {
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
    ...mapState('user', [
      'role', 'shortName']),
    ...mapGetters({
      currPanel: 'getCurrSidebarPanelType',
      lastSelectedPageIndex: 'getLastSelectedPageIndex',
      isShowPagePreview: 'page/getIsShowPagePreview'
    }),
    navItem(): Array<{ icon: string, text: string }> {
      return [
        { icon: 'template', text: `${this.$t('editor.template')}` },
        { icon: 'photo', text: `${this.$t('editor.photo')}` },
        { icon: 'shape', text: `${this.$t('editor.object')}` },
        { icon: 'bg', text: `${this.$t('editor.background')}` },
        { icon: 'text', text: `${this.$t('editor.text')}` },
        { icon: 'folder', text: `${this.$t('editor.myFile')}` }
        // { icon: 'brand', text: `${this.$t('editor.brandkit')}` },
        // { icon: 'photo', text: 'Pexels' }
      ]
    }
  },
  methods: {
    ...mapMutations({
      setCurrSidebarPanel: 'SET_currSidebarPanelType',
      _setIsShowPagePreview: 'page/SET_isShowPagePreview'
    }),
    switchNav(index: number): void {
      this.setCurrSidebarPanel(index)
      this.$emit('toggleSidebarPanel', true)
      if (this.isShowPagePreview) {
        this._setIsShowPagePreview(false)
        pageUtils.scrollIntoPage(this.lastSelectedPageIndex)
      }
    },
    goToPage(pageName: string) {
      this.$router.push({ name: pageName })
    },
    toggleSidebarPanel() {
      this.$emit('toggleSidebarPanel', !this.isSidebarPanelOpen)
    }
  }
})
</script>

<style lang="scss" scoped>
.sidebar {
  @include size(70px, 100%);
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
  overflow: scroll;
  &::-webkit-scrollbar {
    display: none;
  }
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

.nav-setting {
  border-top: 1px solid #494e67;
  padding: 20px 20px 60px 20px;
}

.profile {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  aspect-ratio: 1/1;
  font-weight: 700;
  background: #61aac2;
  border-radius: 50%;
}
</style>
