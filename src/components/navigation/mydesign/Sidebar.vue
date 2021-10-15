<template lang="pug">
  div(class="sidebar")
    div(class="logo")
    div(class="nav")
      div(class="nav-container")
        div(class="nav-item nav-item-all-design")
          svg-icon(iconName="all"
              iconColor="white"
              iconWidth="20px")
          div(class="nav-item__text-primary") 我所有設計
        div(class="nav-item")
          svg-icon(iconName="heart"
              iconColor="white"
              iconWidth="20px")
          div(class="nav-item__text-primary") 我的最愛
        div(v-for="folder in paths" class="nav-item")
          svg-icon(iconName="folder"
              iconColor="white"
              iconWidth="20px")
          div(class="nav-item__text-primary") {{ folder.name }}
        div(class="nav-item")
          svg-icon(iconName="trash"
              iconColor="white"
              iconWidth="20px")
          div(class="nav-item__text-primary") 垃圾桶
        //- div(class="nav-item"
        //-   v-for="(item,index) in navItem" :key="`icon-${index}`"
        //-   :class="currPanel === index ? 'bg-nav-active' : 'none'"
        //-   @click="switchNav(index)")
        //-   svg-icon(:iconName="item.icon"
        //-     :iconColor="currPanel === index ? 'blue-1' : 'gray-3'"
        //-     :iconWidth="'30px'")
        //-   div(class="nav-item-text body-2"
        //-     :class="currPanel === index ? 'text-blue-1' : 'text-gray-3'") {{item.text}}
</template>
<script lang="ts">
import Vue from 'vue'
import { mapGetters, mapMutations } from 'vuex'
import { SidebarPanelType } from '@/store/types'
import { IFolder } from '@/interfaces/design'

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
  props: {
    paths: Array
  },
  computed: {
    ...mapGetters({
      currPanel: 'getCurrSidebarPanelType'
    })
  },
  methods: {
    ...mapMutations({
      setCurrSidebarPanel: 'SET_currSidebarPanelType'
    }),
    switchNav(index: number): void {
      this.setCurrSidebarPanel(index)
    }
  }
})
</script>

<style lang="scss" scoped>
.sidebar {
  @include size(240px, 100%);
  background-color: setColor(nav);
  display: grid;
  grid-template-rows: auto 1fr;
  grid-template-columns: 1fr;
  z-index: setZindex(sidebar);
}

.logo {
  width: 100%;
  height: 50px;
  background-color: setColor(blue-1);
}

.nav {
  @include size(100%, 100%);
  overflow: scroll;
  &::-webkit-scrollbar {
    display: none;
  }
}
.nav-container {
  margin-top: 135px;
  width: 100%;
}
.nav-item {
  width: 100%;
  display: grid;
  grid-template-columns: 20px auto;
  grid-column-gap: 10px;
  align-items: center;
  padding: 10px 0px 10px 16px;
  box-sizing: border-box;
  transition: background-color 0.2s;
  margin-bottom: 10px;
  &__text-primary {
    font-family: 'NotoSansTC';
    text-align: left;
    color: white;
    font-size: 14px;
    font-weight: 700;
    letter-spacing: 2.5px;
  }
  &-all-design {
    @extend .bg-blue-1;
  }
}
</style>
