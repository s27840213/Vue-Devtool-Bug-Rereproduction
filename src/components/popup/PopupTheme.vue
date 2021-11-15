<template lang="pug">
  div(class="popup-theme text-left"
    v-click-outside="handleCancel")
    div(class="popup-theme__recommend px-10")
      btn(class="full-width body-3 rounded mb-10")
        span 自動推薦模板主題
    div(class="py-10 px-15")
      div(class="popup-theme__title body-2 mb-5") 模板主題
      download-check-button(class="popup-theme__checkbox body-3 text-gray-2 pl-5"
        type="checkbox"
        iconSize="12px"
        label="All"
        value="all"
        :default-checked="all"
        @change="handleChange")
      download-check-button(v-for="theme in themes"
        type="checkbox"
        class="popup-theme__checkbox body-3 text-gray-2 pl-5"
        iconSize="12px"
        :key="theme.id"
        :label="theme.title"
        :value="`${theme.id}`"
        :default-checked="selected[`${theme.id}`]"
        @change="handleChange")
    div(class="flex px-20 flex-between")
      btn(class="popup-theme__btn popup-theme__btn--cancel rounded"
        @click.native="handleCancel") 取消
      btn(class="popup-theme__btn rounded"
        :disabled="isConfirmDisabled"
        @click.native="handleSubmit") 確定
</template>

<script lang="ts">
import Vue from 'vue'
import { mapGetters } from 'vuex'
import vClickOutside from 'v-click-outside'
import DownloadCheckButton from '@/components/download/DownloadCheckButton.vue'
import { Itheme } from '@/interfaces/theme'

export default Vue.extend({
  components: { DownloadCheckButton },
  directives: {
    clickOutside: vClickOutside.directive
  },
  props: {
    preSelected: {
      type: Array,
      default: () => []
    }
  },
  data () {
    return {
      all: false,
      selected: {} as { [key: string]: boolean }
    }
  },
  mounted () {
    this.initSelected()
  },
  computed: {
    ...mapGetters({
      themes: 'getThemes'
    }),
    isConfirmDisabled (): boolean {
      return !(Object.values(this.selected).some(Boolean))
    }
  },
  methods: {
    initSelected () {
      const { preSelected, themes } = this
      this.selected = themes.reduce((prev: { [key: string]: boolean }, curr: Itheme) => {
        prev[curr.id] = preSelected.includes(`${curr.id}`)
        return prev
      }, {})
    },
    handleChange (event: { value: string, checked: boolean }) {
      if (event.value === 'all') {
        this.all = event.checked
        event.checked && Object.keys(this.selected)
          .forEach((id: string) => {
            this.selected[id] = event.checked
          })
      } else {
        !event.checked && (this.all = false)
        this.selected[event.value] = event.checked
      }
    },
    handleSubmit () {
      this.$emit('change', this.selected)
    },
    handleCancel () {
      this.$emit('close')
    }
  }
})
</script>

<style lang="scss" scoped>
  .popup-theme {
    padding: 16px 10px 20px;
    display: grid;
    grid-template-columns: 1fr;
    box-sizing: border-box;
    border-radius: 5px;
    box-shadow: 0px 4px 13px rgba(0, 0, 0, 0.25);
    background-color: setColor(white);
    &__recommend {
      border-bottom: 1px solid #E0E0E0;
    }
    &__title {
      font-weight: 800;
      letter-spacing: 2px;
    }
    &__checkbox {
      line-height: 24px;
      margin-bottom: 4px;
    }
    &__btn {
      width: 80px;
      padding: 4px 10px;
      @include body-3();
      font-weight: 700;
      &--cancel {
        color: setColor(gray-2);
        background-color: setColor(gray-5);
      }
      &:disabled {
        background-color: setColor(gray-3);
      }
    }
  }
</style>
