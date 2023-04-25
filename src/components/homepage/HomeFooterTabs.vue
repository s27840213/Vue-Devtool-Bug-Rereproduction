<template lang="pug">
div(class="footer-tabs")
  router-link(:to="'/'" custom v-slot="{navigate, isExactActive}")
    div(class="footer-tabs__item" @click="navigate")
      svg-icon(class="click-disabled"
        :iconName="'home'"
        :iconColor="isExactActive ? 'blue-1' : 'gray-2'"
        :iconWidth="'22px'")
      span(class="body-XXS no-wrap click-disabled"
      :class="isExactActive ? 'text-blue-1' : 'text-gray-2'") {{$t('NN0846')}}
  router-link(:to="'/templates'" custom v-slot="{navigate, isExactActive}")
    div(class="footer-tabs__item" @click="navigate")
      svg-icon(class="click-disabled"
        :iconName="'template'"
        :iconColor="isExactActive ? 'blue-1' : 'gray-2'"
        :iconWidth="'22px'")
      span(class="body-XXS no-wrap click-disabled"
      :class="isExactActive ? 'text-blue-1' : 'text-gray-2'") {{$tc('NN0001', 1)}}
  div(class="footer-tabs__plus")
    svg-icon(class="click-disabled"
      :iconName="'insert-cross'"
      :iconColor="'blue-1'"
      :iconWidth="'40px'")
  router-link(:to="'/mydesign'" custom v-slot="{navigate}")
    div(class="footer-tabs__item" @click="navigate")
      svg-icon(class="click-disabled"
        :iconName="'folder'"
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
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

const activeRouteName = computed(() => route.name)
</script>

<style lang="scss" scoped>
.test{
  position: absolute;
  top: -20px;
  left: 0px;
}
.footer-tabs {
  position: relative;
  -webkit-touch-callout: none;
  -webkit-user-select: none;
  user-select: none;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0px 16px;

  height: 56px;
  background: setColor(white);
  border-top: 0.5px solid setColor(gray-4);
  z-index: setZindex(footer);

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
}
</style>
