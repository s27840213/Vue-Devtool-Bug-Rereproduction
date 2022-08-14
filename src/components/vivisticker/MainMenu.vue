<template lang="pug">
  div(class="main-menu p-15"
      ref="panel")
    div(class="main-menu__bottom-section")
      keep-alive(:include="['panel-object', 'panel-background', 'panel-text']")
        //- p-2 is used to prevent the edge being cutted by overflow: scroll or overflow-y: scroll
        component(class="border-box p-2"
                  :is="`panel-${this.currActiveTab}`")
</template>

<script lang="ts">
import Vue from 'vue'
import PanelObject from '@/components/vivisticker/PanelObject.vue'
import PanelBackground from '@/components/vivisticker/PanelBackground.vue'
import PanelText from '@/components/vivisticker/PanelText.vue'

import { mapGetters } from 'vuex'

export default Vue.extend({
  name: 'main-menu',
  components: {
    PanelObject,
    PanelBackground,
    PanelText
  },
  data() {
    return {
    }
  },
  computed: {
    ...mapGetters({
      currActiveTab: 'vivisticker/getCurrActiveTab'
    })
  },
  methods: {
  }
})
</script>

<style lang="scss" scoped>
.main-menu {
  position: relative;
  height: 100%;
  width: 100%;
  box-sizing: border-box;
  background-color: setColor(nav-active);
  row-gap: 10px;
  display: grid;
  grid-template-columns: 1fr;
  grid-template-rows: auto minmax(0, 1fr);
  justify-items: center;

  &__bottom-section {
    width: 100%;
    height: 100%;
    overflow-y: scroll;
    @include no-scrollbar;
  }
}
</style>
