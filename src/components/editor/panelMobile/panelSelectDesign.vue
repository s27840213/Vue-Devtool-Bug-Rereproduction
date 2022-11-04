<template lang="pug">
  div(class="panel-select-design") test
</template>

<script lang="ts">
import { IMyDesign } from '@/interfaces/vivisticker'
import editorUtils from '@/utils/editorUtils'
import modalUtils from '@/utils/modalUtils'
import vivistickerUtils from '@/utils/vivistickerUtils'
import Vue from 'vue'
import { mapGetters, mapMutations } from 'vuex'

export default Vue.extend({
  data() {
    return {
    }
  },
  computed: {
    ...mapGetters({
      MyDesignTab: 'vivisticker/getMyDesignTab',
      MyDesignFileList: 'vivisticker/getMyDesignFileList',
      selectedDesigns: 'vivisticker/getSelectedDesigns'
    }),
    list(): IMyDesign[] {
      return this.MyDesignFileList(this.MyDesignTab) as IMyDesign[]
    }
  },
  methods: {
  }
})
</script>

<style lang="scss" scoped>
.panel-select-design {
  padding-bottom: 8px;
  &__options {
    display: flex;
    flex-direction: column;
  }
  &__option {
    height: 40px;
    padding: 0 24px;
    display: flex;
    gap: 16px;
    align-items: center;
    justify-content: start;
    &:not(.version):active {
      background: setColor(black-6);
    }
    &.selected {
      background: setColor(black-6);
    }
  }
  &__option-icon {
    @include size(24px);
    display: flex;
    align-items: center;
    justify-content: center;
  }
  &__option-title {
    @include body-SM;
    color: setColor(gray-2);
    &.version {
      color: setColor(gray-3);
    }
  }
}
</style>
