<template lang="pug">
  div(class="download-page-selection")
    dropdown(ref="dropdown"
      isCustomOptions
      @open="handleReset")
      span(class="download-page-selection__label") {{ rangeLabel }} 頁
      template(v-slot:custom)
        div(class="download-page-selection__options py-10 px-15 flex")
          div(class="mb-10 pointer" @click.self="handleCancel") 取消所有選取
          download-check-button(v-for="(status, idx) in preSelected"
            class="mb-10"
            type="checkbox"
            :key="`page_${idx}`"
            :default-checked="status"
            :label="`第 ${idx + 1} 頁`"
            @change="({ checked }) => handleSelect(idx, checked)")
          div
            btn(class="full-width body-3 rounded"
              @click.native="handleSubmit") 完成
</template>

<script lang="ts">
import Vue from 'vue'
import { mapGetters } from 'vuex'
import DownloadCheckButton from './DownloadCheckButton.vue'

export default Vue.extend({
  data () {
    return {
      selected: [] as boolean[],
      preSelected: [] as boolean[],
      rangeLabel: ''
    }
  },
  mounted () {
    const { pages } = this
    const initialStatus = new Array(pages.length).fill(false)
    this.preSelected = [...initialStatus]
    this.handleLabel()
  },
  components: {
    DownloadCheckButton
  },
  computed: {
    ...mapGetters({
      pages: 'getPages'
    })
  },
  methods: {
    handleSelect (pageIndex: number, checked: boolean) {
      this.preSelected = this.preSelected.map((status, idx) => idx === pageIndex ? checked : status)
    },
    handleCancel () {
      this.preSelected = this.preSelected.map(() => false)
    },
    handleReset () {
      this.preSelected = [...this.selected]
    },
    handleSubmit () {
      (this.$refs.dropdown as any).handleClose()
      this.handleLabel()
      this.$emit('confirm', this.preSelected)
    },
    handleLabel () {
      const { preSelected } = this
      // covert array of boolean to [[1,2,3], [5,6], [8]]
      const pageSelectedGroup = preSelected
        .reduce((prev: Array<number[]>, curr: boolean, idx: number) => {
          const lastIndex = prev.length - 1
          curr ? (prev[lastIndex].push(idx + 1)) : (prev.push([]))
          return prev
        }, [[]] as Array<number[]>)

      const result = pageSelectedGroup
        .filter((group: number[]) => group.length)
        .map(group => group.length > 1 ? `${group[0]}-${group.pop()}` : group[0])
        .join(',')
      this.rangeLabel = result || '--'
      this.selected = [...this.preSelected]
    }
  }
})
</script>

<style lang="scss" scoped>
  .download-page-selection {
    &__label {
      width: 40px;
      display: inline-block;
      vertical-align: top;
      text-overflow: ellipsis;
      overflow: hidden;
      white-space: nowrap;
    }
    &__options {
      white-space: nowrap;
      flex-direction: column;
      cursor: default;
    }
  }
  .btn {
    padding: 3px 10px;
    font-size: 12px;
    line-height: 22px;
    min-width: 100px;
  }
</style>
