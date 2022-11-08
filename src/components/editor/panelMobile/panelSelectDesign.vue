<template lang="pug">
  div(class="panel-select-design")
    div(class="panel-select-design__left"
        @click.prevent.stop="handleToggleAllSelected")
      div(class="panel-select-design__left__checkbox"
          :class="{checked: isAllSelected}")
        svg-icon(v-if="isAllSelected" iconName="check" iconColor="white" iconWidth="20.7px")
      div(class="panel-select-design__left__text")
        span {{ isAllSelected ? $t('STK0016') : $t('STK0015') }}
    div(class="panel-select-design__right"
        :class="{disabled: !isAnySelected}"
        @click.prevent.stop="handleDeleteSelected")
      div(class="panel-select-design__right__icon")
        svg-icon(iconName="trash" :iconColor="isAnySelected ? 'white' : 'gray-2'" iconWidth="19.5px")
      div(class="panel-select-design__right__text"
          :class="{disabled: !isAnySelected}")
        span {{ $t('NN0034') }}
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
      myDesignTab: 'vivisticker/getMyDesignTab',
      myDesignFileList: 'vivisticker/getMyDesignFileList',
      selectedDesigns: 'vivisticker/getSelectedDesigns'
    }),
    list(): IMyDesign[] {
      return this.myDesignFileList(this.myDesignTab) as IMyDesign[]
    },
    isAllSelected(): boolean {
      return this.list.length === Object.keys(this.selectedDesigns).length
    },
    isAnySelected(): boolean {
      return Object.keys(this.selectedDesigns).length > 0
    }
  },
  watch: {
    myDesignTab() {
      this.leaveSelectionMode()
    }
  },
  methods: {
    ...mapMutations({
      setIsInSelectionMode: 'vivisticker/SET_isInSelectionMode',
      selectAllDesigns: 'vivisticker/UPDATE_selectAllDesigns',
      deleteDesigns: 'vivisticker/UPDATE_deleteDesigns',
      clearSelectedDesigns: 'vivisticker/UPDATE_clearSelectedDesigns'
    }),
    handleToggleAllSelected() {
      if (this.isAllSelected) {
        this.clearSelectedDesigns()
      } else {
        this.selectAllDesigns(this.myDesignTab)
      }
    },
    handleDeleteSelected() {
      if (!this.isAnySelected) return
      modalUtils.setModalInfo(
        `${this.$t('NN0693')}`,
        [`${this.$t('NN0244')}`],
        {
          msg: `${this.$t('NN0034')}`,
          action: this.confirmDeletion
        },
        {
          msg: `${this.$t('NN0203')}`,
          action: modalUtils.clearModalInfo,
          style: {
            color: '#474A57',
            background: '#D9DBE1'
          }
        }
      )
    },
    confirmDeletion() {
      for (const design of Object.values(this.selectedDesigns) as IMyDesign[]) {
        vivistickerUtils.deleteAsset(`mydesign-${this.myDesignTab}`, design.id, 'mydesign')
      }
      this.deleteDesigns(this.myDesignTab)
      this.leaveSelectionMode()
    },
    leaveSelectionMode() {
      this.clearSelectedDesigns()
      this.setIsInSelectionMode(false)
      modalUtils.clearModalInfo()
      editorUtils.setCloseMobilePanelFlag(true)
    }
  }
})
</script>

<style lang="scss" scoped>
.panel-select-design {
  padding: 16px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  &__left {
    margin-left: 2px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    &__checkbox {
      @include size(20px);
      background: setColor(gray-6);
      border: 1px solid setColor(black-5);
      border-radius: 50%;
      box-sizing: border-box;
      display: flex;
      justify-content: center;
      align-items: center;
      &.checked {
        background: setColor(black-3);
        border: none;
      }
    }
    &__text {
      @include body-SM;
      color: setColor(gray-2);
    }
  }
  &__right {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    background: setColor(black-2);
    border-radius: 10px;
    height: 42px;
    padding: 0 16px;
    &.disabled {
      background: setColor(black-6);
    }
    &__icon {
      @include size(19.5px);
      display: flex;
      align-items: center;
      justify-content: center;
    }
    &__text {
      @include body-SM;
      transition: color 0.2s;
      color: setColor(white);
      &.disabled {
        color: setColor(gray-2);
      }
    }
  }
}
</style>
