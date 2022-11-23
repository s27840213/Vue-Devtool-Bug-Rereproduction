<template lang="pug">
  div(class="mobile-folder-item"
      @click="emitGoto")
    div(class="mobile-folder-item__body")
      div(v-if="isSelected"
          class="mobile-folder-item__checkbox-checked"
          @click.stop="emitDeselect")
          svg-icon(iconName="done"
                  iconWidth="11.82px"
                  iconHeight="8.71px"
                  iconColor="white")
      div(v-if="!isSelected && isAnySelected"
        class="mobile-folder-item__checkbox"
        @click.stop="emitSelect")
      div(class="mobile-folder-item__block")
        svg-icon(style="pointer-events: none"
                iconName="folder"
                iconWidth="24px"
                iconColor="gray-3")
      div(class="mobile-folder-item__info")
        div(class="mobile-folder-item__name")
          span(:title="config.name") {{ config.name }}
        //- div(class="mobile-folder-item__description") {{ $t('NN0197', { num: 0 }) }}
    div(class="mobile-folder-item__more"
        @click.stop="openMenu()")
      svg-icon(iconName="more_vertical"
              iconWidth="24px"
              iconColor="gray-2")
</template>

<script lang="ts">
import Vue from 'vue'
import { mapGetters, mapMutations } from 'vuex'

export default Vue.extend({
  props: {
    path: Array,
    config: Object,
    isAnySelected: Boolean,
    isSelected: Boolean,
    index: Number
  },
  computed: {
    ...mapGetters('design', {
      selectedDesigns: 'getSelectedDesigns'
    }),
    selectedNum(): number {
      return Object.keys(this.selectedDesigns).length
    },
    isMultiSelected(): boolean {
      return this.selectedNum > 1
    },
    isTempFolder(): boolean {
      return this.config.id.endsWith('_new')
    }
  },
  methods: {
    ...mapMutations('design', {
      clearSelection: 'UPDATE_clearSelection',
      setBottomMenu: 'SET_bottomMenu',
      setMobileFolderBuffer: 'SET_mobileFolderBuffer'
    }),
    emitGoto() {
      if (this.isAnySelected) {
        this.$emit(this.isSelected ? 'deselect' : 'select')
        return
      }
      if (this.isTempFolder) return
      this.$emit('goto')
    },
    openMenu() {
      if (this.isTempFolder) return
      this.clearSelection()
      this.setMobileFolderBuffer({
        parents: this.path,
        folder: this.config
      })
      this.setBottomMenu('folder-menu')
    },
    emitSelect() {
      this.$emit('select')
    },
    emitDeselect() {
      this.$emit('deselect')
    }
  }
})
</script>

<style lang="scss" scoped>
.mobile-folder-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 16px;
  &:active {
    background: setColor(blue-4);
  }
  &__body {
    display: flex;
    align-items: center;
    > div + div {
      margin-left: 16px;
    }
  }
  &__info {
    display: flex;
    flex-direction: column;
    align-items: start;
  }
  &__block {
    width: 60px;
    height: 54px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
    background: setColor(gray-5);
  }
  &__checkbox {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background-color: white;
    border: 1px solid #969bab;
    box-sizing: border-box;
  }
  &__checkbox-checked {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background-color: setColor(blue-1);
    display: flex;
    align-items: center;
    justify-content: center;
  }
  &__more {
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  &__name {
    max-width: 40vw;
    height: 25px;
    text-align: left;
    overflow: hidden;
    text-overflow: ellipsis;
    > span {
      @include body-SM;
      color: setColor(gray-1);
      white-space: nowrap;
    }
  }
  &__description {
    height: 22px;
    text-align: left;
    @include body-XS;
    color: setColor(gray-3);
    white-space: nowrap;
  }
}
</style>
