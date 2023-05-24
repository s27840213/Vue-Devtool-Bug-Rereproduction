<template lang="pug">
div(class="footer-tabs" :style="footerTabsStyles")
  router-link(:to="'/'" custom v-slot="{navigate, isExactActive}")
    div(class="footer-tabs__item" @click="navigate")
      svg-icon(class="click-disabled"
        :iconName="isExactActive ? 'home-tap' :'home'"
        :iconColor="isExactActive ? 'blue-1' : 'gray-2'"
        :iconWidth="'22px'")
      span(class="body-XXS no-wrap click-disabled"
      :class="isExactActive ? 'text-blue-1' : 'text-gray-2'") {{$t('NN0846')}}
  router-link(:to="'/templates'" custom v-slot="{navigate, isExactActive}")
    div(class="footer-tabs__item" @click="navigate")
      svg-icon(class="click-disabled"
        :iconName="isExactActive ? 'template-tap' :'template'"
        :iconColor="isExactActive ? 'blue-1' : 'gray-2'"
        :iconWidth="'22px'")
      span(class="body-XXS no-wrap click-disabled"
      :class="isExactActive ? 'text-blue-1' : 'text-gray-2'") {{$tc('NN0001', 1)}}
  btn-new-design(class="footer-tabs__plus" v-slot="slotProps")
    svg-icon(
      :iconName="'insert-cross'"
      :iconColor="'blue-1'"
      :iconWidth="'56px'"
      @click="slotProps.openPopup")
  router-link(:to="'/mydesign'" custom v-slot="{navigate}")
    div(class="footer-tabs__item" @click="navigate")
      svg-icon(class="click-disabled"
        :iconName="activeRouteName === 'MyDesign' ? 'folder-tap' : 'folder'"
        :iconColor="activeRouteName === 'MyDesign' ? 'blue-1' : 'gray-2'"
        :iconWidth="'22px'")
      span(class="body-XXS no-wrap click-disabled"
      :class="activeRouteName === 'MyDesign' ? 'text-blue-1' : 'text-gray-2'") {{$t('NN0080')}}
  router-link(:to="'/settings'" custom v-slot="{navigate}")
    div(class="footer-tabs__item" @click="navigate")
      svg-icon(class="click-disabled"
        :iconName="'menu'"
        :iconColor="activeRouteName === 'Settings' ? 'blue-1' : 'gray-2'"
        :iconWidth="'22px'")
      span(class="body-XXS no-wrap click-disabled"
        :class="activeRouteName === 'Settings' ? 'text-blue-1' : 'text-gray-2'") {{$t('NN0082')}}
</template>

<script lang="ts" setup>
import BtnNewDesign from '@/components/new-design/BtnNewDesign.vue'
import picWVUtils from '@/utils/picWVUtils'
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useStore } from 'vuex'

const route = useRoute()
const store = useStore()

const userInfo = computed(() => store.getters[picWVUtils.appendModuleName('getUserInfo')])

const footerTabsStyles = computed((): { [index: string]: string } => {
  return {
    paddingBottom: `${userInfo.value.homeIndicatorHeight}px`
  }
})
const activeRouteName = computed(() => route.name)
// const sizeMenuOpened = ref(false)
</script>

<style lang="scss" scoped>
.footer-tabs {
  position: relative;
  -webkit-touch-callout: none;
  -webkit-user-select: none;
  user-select: none;
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 1fr 1fr;
  grid-template-rows: 1fr;
  padding: 0px 16px;

  height: 60px;
  background: setColor(white);
  border-top: 0.5px solid setColor(gray-4);
  z-index: setZindex(45);

  &__item {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
    > span {
      transition: background-color 0.2s, color 0.2s;
      transform: scale(calc(10 / 12));
    }
  }

  &__plus {
    display: flex;
    align-items: center;
    justify-content: center;
  }
}
</style>
