<template lang="pug">
  div(class="sidebar")
    div(class="logo")
    div(class="nav")
      div(class="nav-container")
        div(class="nav-item pointer"
          v-for="(item,index) in navItem" :key="`icon-${index}`"
          :class="currPanel === index ? 'bg-nav-active' : 'none'"
          @click="switchNav(index)")
          svg-icon(:iconName="item.icon"
            :iconColor="currPanel === index ? 'blue-1' : 'gray-3'"
            :iconWidth="'30px'")
          div(class="nav-item-text body-2"
            :class="currPanel === index ? 'text-blue-1' : 'text-gray-3'") {{item.text}}
      div(class="nav-setting pointer"
        @click="switchNav(SidebarPanelType.page)")
        svg-icon(:iconName="'navPage'"
          :iconColor="currPanel=== SidebarPanelType.page? 'blue-1' : 'gray-3'"
          :iconWidth="'30px'")
        div(class="nav-item-text body-3"
        :class="currPanel=== SidebarPanelType.page ? 'text-blue-1' : 'text-gray-3'") 導覽頁
</template>
<script lang="ts">
import Vue from 'vue'
import { mapGetters, mapMutations } from 'vuex'
import { SidebarPanelType } from '@/store/types'
import pageUtils from '@/utils/pageUtils'

export default Vue.extend({
  components: {
  },
  data() {
    return {
      SidebarPanelType,
      navItem: [
        { icon: 'template', text: 'Templates' },
        { icon: 'photo', text: 'Photos' },
        { icon: 'shape', text: 'Objects' },
        { icon: 'bg', text: 'Background' },
        { icon: 'text', text: 'Text' },
        { icon: 'folder', text: 'MyFile' },
        { icon: 'brand', text: 'Brandkit' },
        { icon: 'photo', text: 'Pexels' }
      ]
    }
  },
  computed: {
    ...mapGetters({
      currPanel: 'getCurrSidebarPanelType',
      lastSelectedPageIndex: 'getLastSelectedPageIndex',
      isShowPagePreview: 'page/getIsShowPagePreview'
    })
  },
  methods: {
    ...mapMutations({
      setCurrSidebarPanel: 'SET_currSidebarPanelType',
      _setIsShowPagePreview: 'page/SET_isShowPagePreview'
    }),
    switchNav(index: number): void {
      this.setCurrSidebarPanel(index)

      if (this.isShowPagePreview) {
        this._setIsShowPagePreview(false)
        pageUtils.scrollIntoPage(this.lastSelectedPageIndex)
      }
    }
  }
})
</script>

<style lang="scss" scoped>
.sidebar {
  @include size(100px, 100%);
  background-color: setColor(nav);
  display: grid;
  grid-template-rows: auto 1fr;
  grid-template-columns: 1fr;
  // box-shadow: 2px 0px 5px setColor(gray-4);
  z-index: setZindex(sidebar);
}

.logo {
  width: 100%;
  height: 50px;
  background-color: setColor(blue-1);
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
  grid-template-rows: repeat(7, 1fr);
  width: 100%;
}
.nav-item {
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  padding: 15px 0px;
  box-sizing: border-box;
  transition: background-color 0.2s;
  &__text {
    transition: color 0.2s;
  }
}

.nav-setting {
  border-top: 1px solid #494e67;
  padding: 30px;
}
</style>
