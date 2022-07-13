<template lang="pug">
  div(class="bottom-menu")
    div(class="bottom-menu__wrapper relative")
      div(v-if="isPrevButtonNeeded" class="bottom-menu__prev pointer")
        svg-icon(iconName="chevron-left" iconColor="gray-3" iconWidth="20px")
      div(class="bottom-menu__close pointer"
          @click="handleCloseMenu")
        svg-icon(iconName="close" iconColor="gray-3" iconWidth="20px")
      div(v-if="bottomMenu === 'trash-info'" class="trash-info") {{$t('NN0241')}}
</template>

<script lang="ts">
import Vue from 'vue'
import { mapGetters, mapActions } from 'vuex'

const PREV_BUTTON_MENUS = ['new-folder', 'move-folder']

export default Vue.extend({
  components: {
  },
  data() {
    return {
    }
  },
  props: {
    bottomMenu: String
  },
  watch: {
  },
  computed: {
    isPrevButtonNeeded(): boolean {
      return PREV_BUTTON_MENUS.includes(this.bottomMenu)
    }
  },
  methods: {
    handleCloseMenu() {
      this.$emit('close')
    }
  }
})
</script>

<style lang="scss" scoped>
.bottom-menu {
  position: fixed;
  left: 0;
  bottom: 0;
  width: 100%;
  background: #FFFFFF;
  box-shadow: 0px 0px 8px rgba(60, 60, 60, 0.31);
  border-radius: 10px 10px 0px 0px;
  z-index: 1001;
  &__wrapper {
    @include size(100%, 100%);
  }
  &__prev {
    position: absolute;
    top: 16px;
    left: 16px;
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
    position: absolute;
    top: 16px;
    right: 16px;
    @include size(20px, 20px);
    border-radius: 50%;
    background: setColor(gray-4);
    display: flex;
    align-items: center;
    justify-content: center;
  }
}

.horizontal-rule {
  height: 1px;
  background-color: setColor(gray-4);
  margin-top: 21px;
  margin-bottom: 58px;
}

.trash-info {
  width: 100%;
  height: 59px;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
