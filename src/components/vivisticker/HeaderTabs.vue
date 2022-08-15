<template lang="pug">
  div(class="header-bar" @pointerdown.stop)
    div(class="header-bar__left")
      template(v-if="!isInCategory && !isInEditor")
        div(style="width: 20px; height: 20px")
          svg-icon(iconName="vivisticker_logo" iconWidth="20px" iconColor="white")
        div(style="width: 100px; height: 18px")
          svg-icon(iconName="vivisticker_title" iconWidth="100px" iconHeight="18px" iconColor="white")
    div(class="header-bar__right")
      template(v-if="!isInCategory && !isInEditor")
        div(class="header-bar__feature-icon" style="width: 24px; height: 24px")
          svg-icon(iconName="more" iconWidth="24px" iconColor="white")
</template>
<script lang="ts">
import Vue from 'vue'
import { mapGetters } from 'vuex'

export default Vue.extend({
  components: {
  },
  data() {
    return {
    }
  },
  computed: {
    ...mapGetters({
      isInEditor: 'vivisticker/getIsInEditor'
    }),
    isInCategory(): boolean {
      return false
    }
  },
  methods: {
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
  &__right {
    display: flex;
    align-items: center;
    justify-content: center;
  }
}
</style>
