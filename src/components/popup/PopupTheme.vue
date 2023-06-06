<template lang="pug">
div(class="popup-theme text-left"
  v-click-outside="vcoConfig")
  div(class="popup-theme__recommend")
    nubtn(size="mid-full"  @click="handleRecommend") {{$t('NN0322')}}
  div(class="popup-theme-items")
    div(class="caption-LG body-2 mb-5") {{ $t('NN0321') }}
    checkbox(v-model="all"
            class="popup-theme-items__checkbox body-3 pl-5") {{$t('NN0324')}}
    checkbox(v-for="theme in themes"
      :key="theme.id"
      v-model="selected[theme.id]"
      class="popup-theme-items__checkbox body-3 pl-5") {{theme.title}}
  div(class="popup-theme-buttons")
    nubtn(theme="secondary" size="sm-full" @click="handleCancel") {{$t('NN0203')}}
    nubtn(size="sm-full"
        :disabled="isConfirmDisabled"
        @click="handleSubmit") {{$tc('NN0164', 1)}}
</template>

<script lang="ts">
import Checkbox from '@/components/global/Checkbox.vue'
import { Itheme } from '@/interfaces/theme'
import pageUtils from '@/utils/pageUtils'
import themeUtils from '@/utils/themeUtils'
import vClickOutside from 'click-outside-vue3'
import { mapValues } from 'lodash'
import { defineComponent } from 'vue'
import { mapGetters } from 'vuex'

export default defineComponent({
  components: {
    Checkbox
  },
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
          return !(event.target as HTMLElement).matches(
            '.panel-template .search-bar .nubtn, .panel-template .search-bar .nubtn *'
          )
        }
      },
      selected: {} as { [key: string]: boolean }
    }
  },
  created() {
    this.initSelected(this.preSelected as string[])
  },
  computed: {
    ...mapGetters({
      themes: 'getEditThemes'
    }),
    isConfirmDisabled(): boolean {
      return !(Object.values(this.selected).some(Boolean))
    },
    all: {
      get: function(): boolean { return Object.values(this.selected).every(Boolean) },
      set: function(newVal: boolean) {
        this.selected = mapValues(this.selected, () => newVal)
      }
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
    handleSubmit() {
      this.$emit('change', this.selected)
    },
    handleCancel() {
      this.$emit('close')
    },
    handleRecommend() {
      const currFocusPageSize = pageUtils.currFocusPageSize
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
  grid-template-rows: 51px 1fr 24px;
  row-gap: 10px;
  box-sizing: border-box;
  border-radius: 5px;
  box-shadow: 0px 4px 13px rgba(0, 0, 0, 0.25);
  background-color: setColor(white);
  color: setColor(gray-2);
  &__recommend {
    border-bottom: 1px solid #e0e0e0;
  }
}

.popup-theme-items {
  @include hover-scrollbar();
  overflow: auto;
  &__checkbox {
    line-height: 24px;
    margin-bottom: 4px;
  }
}

.popup-theme-buttons {
  display: flex;
  justify-content: space-around;
  gap: 20px;
}
</style>
