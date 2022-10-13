<template lang="pug">
  div(class="my-design"
      ref="panel")
    div(class="my-design__bottom-section")
</template>

<script lang="ts">
import Vue from 'vue'
import { mapGetters } from 'vuex'
import vivistickerUtils from '@/utils/vivistickerUtils'

export default Vue.extend({
  name: 'my-design',
  computed: {
    ...mapGetters({
      MyDesignTab: 'vivisticker/getMyDesignTab'
    })
  },
  methods: {
  }
})
</script>

<style lang="scss" scoped>
.my-design {
  position: relative;
  height: 100%;
  width: 100%;
  box-sizing: border-box;
  background-color: setColor(black-2);

  &__bottom-section {
    width: 100%;
    height: 100%;
    overflow-y: scroll;
    @include no-scrollbar;
  }
}
</style>
