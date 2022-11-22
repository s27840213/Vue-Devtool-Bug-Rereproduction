<template lang="pug">
div(class="popup-theme text-left"
  v-click-outside="vcoConfig")
  div(class="popup-theme__recommend")
    btn(class="full-width body-3 rounded mb-10"
      @click.native="handleRecommend")
      span(v-html="$t('NN0322')")
  div(class="popup-theme-items")
    div(class="caption-LG body-2 mb-5") {{ $t('NN0321') }}
    download-check-button(class="popup-theme-items__checkbox body-3 text-gray-2 pl-5"
      type="checkbox"
      iconSize="12px"
      :label="$t('NN0324')"
      value="all"
      :default-checked="all"
      @change="handleAllCheck")
    download-check-button(v-for="theme in themes"
      type="checkbox"
      class="popup-theme-items__checkbox body-3 text-gray-2 pl-5"
      iconSize="12px"
      :key="theme.id"
      :label="theme.title"
      :value="`${theme.id}`"
      :default-checked="selected[`${theme.id}`]"
      @change="handleChange")
  div(class="popup-theme-buttons")
    btn(class="popup-theme-buttons__btn popup-theme-buttons__btn--cancel rounded"
      type="primary-sm"
      @click.native="handleCancel") {{$t('NN0203')}}
    btn(class="popup-theme-buttons__btn rounded"
      type="primary-sm"
      :disabled="isConfirmDisabled"
      @click.native="handleSubmit") {{$tc('NN0164', 1)}}
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { mapGetters } from 'vuex'
import vClickOutside from 'v-click-outside'
import DownloadCheckButton from '@/components/download/DownloadCheckButton.vue'
import { Itheme } from '@/interfaces/theme'
import themeUtils from '@/utils/themeUtils'

export default defineComponent({
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
  data() {
    return {
      vcoConfig: {
        handler: () => { this.$emit('close') },
        middleware: (event: MouseEvent) => {
          // Prevent v-click-outside if user press advanced svg to close it.
          // It will cause error because mobile click event call by pointerdown have delay.
          return ((event.target as HTMLElement).attributes.getNamedItem('xlink:href') as Attr)?.nodeValue !== '#advanced'
        }
      },
      selected: {} as { [key: string]: boolean }
    }
  },
  mounted() {
    this.initSelected(this.preSelected as string[])
  },
  computed: {
    ...mapGetters({
      themes: 'getEditThemes'
    }),
    isConfirmDisabled(): boolean {
      return !(Object.values(this.selected).some(Boolean))
    },
    all(): boolean {
      return Object.values(this.selected).every(Boolean)
    }
  },
  methods: {
    initSelected(preSelected: string[]) {
      const { themes } = this
      this.selected = themes.reduce((prev: { [key: string]: boolean }, curr: Itheme) => {
        prev[curr.id] = preSelected.includes(`${curr.id}`)
        return prev
      }, {})
    },
    handleAllCheck(event: { value: string, checked: boolean }) {
      Object.keys(this.selected)
        .forEach((id: string) => {
          this.selected[id] = event.checked
        })
    },
    handleChange(event: { value: string, checked: boolean }) {
      this.selected[event.value] = event.checked
    },
    handleSubmit() {
      this.$emit('change', this.selected)
    },
    handleCancel() {
      this.$emit('close')
    },
    handleRecommend() {
      const currFocusPageSize = themeUtils.getFocusPageSize()
      const themes = themeUtils.getThemesBySize(currFocusPageSize.width, currFocusPageSize.height)
      this.initSelected(themes.map(theme => `${theme.id}`))
    }
  }
})
</script>

<style lang="scss" scoped>
.popup-theme {
  padding: 16px 20px 20px;
  display: grid;
  grid-template-columns: 1fr;
  grid-template-rows: 47px 1fr 24px;
  row-gap: 10px;
  box-sizing: border-box;
  border-radius: 5px;
  box-shadow: 0px 4px 13px rgba(0, 0, 0, 0.25);
  background-color: setColor(white);
  &__recommend {
    border-bottom: 1px solid #e0e0e0;
  }
}

.popup-theme-items {
  overflow: auto;
  &__checkbox {
    line-height: 24px;
    margin-bottom: 4px;
  }
}

.popup-theme-buttons {
  display: flex;
  justify-content: space-around;
  &__btn.btn-inactive-sm,
  &__btn.btn-primary-sm {
    width: 80px;
    padding: 4px 10px;
    &:disabled {
      background-color: setColor(gray-3);
    }
  }
  &__btn--cancel.btn-primary-sm {
    color: setColor(gray-2);
    background-color: setColor(gray-5);
  }
}
</style>
