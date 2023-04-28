<template lang="pug">
div(class="size-menu" :style="rootStyles")
  div(class="size-menu__wrapper relative")
    div(class="size-menu__prev pointer" @click="handleCloseMenu")
      svg-icon(iconName="close" iconColor="gray-3" iconWidth="20px")
    div(class="size-menu__close pointer" @click="handleOK")
      svg-icon(iconName="chevron-right" iconColor="gray-3" iconWidth="20px")
  page-size-selector(:isDarkTheme="false" :forHomePage="true")
</template>

<script lang="ts">
import PageSizeSelector from '@/components/editor/PageSizeSelector.vue'
import picWVUtils from '@/utils/picWVUtils'
import vClickOutside from 'click-outside-vue3'
import { defineComponent } from 'vue'
import { mapActions, mapGetters } from 'vuex'

export default defineComponent({
  emits: ['send', 'close'],
  directives: {
    clickOutside: vClickOutside.directive
  },
  components: {
    PageSizeSelector
  },
  created() {
    this.getCategories()
  },
  computed: {
    ...mapGetters({
      userInfo: picWVUtils.appendModuleName('getUserInfo')
    }),
    rootStyles(): {[key: string]: string} {
      return {
        paddingBottom: `${this.userInfo.homeIndicatorHeight}px`
      }
    }
  },
  methods: {
    ...mapActions('layouts',
      [
        'getCategories',
        'getRecently'
      ]
    ),
    handleOK() {
      this.$emit('send')
    },
    handleCloseMenu() {
      this.$emit('close')
    }
  }
})
</script>

<style lang="scss" scoped>
.size-menu {
  height: 90%;
  position: fixed;
  left: 0;
  bottom: 0;
  width: 100%;
  background: #FFFFFF;
  box-shadow: 0px 0px 8px rgba(60, 60, 60, 0.31);
  border-radius: 10px 10px 0px 0px;
  z-index: 1001;
  padding: 12px 24px;
  box-sizing: border-box;
  &__wrapper {
    width: 100%;
    display: flex;
    justify-content: space-between;
    margin-bottom: 12px;
  }
  &__prev {
    @include size(20px, 20px);
    border-radius: 50%;
    background: setColor(gray-4);
    display: flex;
    align-items: center;
    justify-content: center;
    & > svg {
      transform: translate(-1px);
    }
  }
  &__close {
    @include size(20px, 20px);
    border-radius: 50%;
    background: setColor(gray-4);
    display: flex;
    align-items: center;
    justify-content: center;
  }
}
</style>
