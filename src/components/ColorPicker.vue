<template lang="pug">
  div(class="color-picker" ref="colorPicker"
      :style="{'box-shadow': isMobile ? 'none' : '0 0 2px rgba(0, 0, 0, 0.3), 0 4px 8px rgba(0, 0, 0, 0.3)'}")
    chrome-picker(
      class="color-picker__picker"
      :value="convertedHex"
      @input="updateHex"
      @paste="onPaste"
      @mouseup.native="onmouseup"
      :disableFields="true"
      :disableAlpha="true"
      :isMobile="isMobile"
      :fullWidth="isMobile"
      :aspectRatio="aspectRatio")
    div(:class="{'px-10': !isTouchDevice}")
      div(class="color-picker__hex")
        svg-icon(v-if="!isTouchDevice"
          class="pointer"
          iconName="eye-dropper"
          :iconWidth="'20px'"
          :iconColor="'gray-2'"
          @click.native="eyeDropper"
          v-hint="$t('NN0407')")
        span(class="body-1") Hex
        div(class="color-picker__input")
          div(:style="{'background-color': convertedHex}")
          input(
            ref="input"
            type="text"
            spellcheck="false"
            v-model="color"
            maxlength="7")
</template>

<script lang="ts">
import Vue from 'vue'
import { mapGetters, mapMutations } from 'vuex'
import layerUtils from '@/utils/layerUtils'
import { Chrome } from 'vue-color'
import i18n from '@/i18n'
import generalUtils from '@/utils/generalUtils'
import { checkAndConvertToHex } from '@/utils/colorUtils'

export default Vue.extend({
  props: {
    currentColor: String,
    isMobile: {
      type: Boolean,
      default: false
    },
    aspectRatio: {
      type: Number,
      default: 56.25
    }
  },
  components: {
    'chrome-picker': Chrome
  },
  data() {
    return {
      color: this.currentColor || '#194d33',
      finalizeTimer: -1
    }
  },
  mounted() {
    const root = this.$refs.colorPicker as HTMLElement
    const input = this.$refs.input as HTMLInputElement
    if (!generalUtils.isTouchDevice()) {
      root.focus()
      input.select()
    }
  },
  computed: {
    ...mapGetters({
      documentColors: 'color/getDocumentColors',
      defaultColors: 'color/getDefaultColors'
    }),
    convertedHex(): string {
      const formatedColor = this.convertHex(this.color)
      this.$emit('update', formatedColor)
      return formatedColor
    },
    isTouchDevice() {
      return generalUtils.isTouchDevice()
    }
  },
  watch: {
    color(): void {
      this.color = '#' + this.color.replaceAll(/[^a-fA-F0-9]/g, '')
      this.color = this.color.toUpperCase()
      if (this.color.indexOf('#') === -1) {
        this.color = `#${this.color}`
      }
      if (this.color.length === 0) {
        this.color = '#'
      }
      this.delayedFinalize(this.convertHex(this.color))
    }
  },
  methods: {
    ...mapMutations({
      updateDocumentColors: 'UPDATE_documentColors'
    }),
    paddingRight(str: string, n: number) {
      let len = str.length
      while (len < n) {
        str = str + '0'
        len++
      }
      return str
    },
    updateHex(val: any) {
      this.color = val.hex
    },
    onPaste(event: ClipboardEvent) {
      console.log(event.clipboardData)
    },
    colorStyles(color: string) {
      return {
        backgroundColor: color
      }
    },
    onmouseup() {
      this.updateDocumentColors({ pageIndex: layerUtils.pageIndex, color: this.color })
    },
    eyeDropper() {
      if (!(window as any).EyeDropper) {
        Vue.notify({ group: 'error', text: `${i18n.t('NN0406')}` })
        return
      }

      const eyeDropper = new (window as any).EyeDropper()
      if (eyeDropper !== undefined) {
        eyeDropper.open().then((result: { sRGBHex: string }) => {
          this.color = checkAndConvertToHex(result.sRGBHex)
        })
      }
    },
    convertHex(color: string) {
      let hex = color.slice(1).split('')
      let result = ''
      const len = hex.length
      switch (len) {
        case 0:
          result = '000000'
          break
        case 1:
        case 2:
        case 3:
          hex = hex.map((val: string) => val + val)
          result = this.paddingRight(hex.join(''), 6)
          break
        case 4:
        case 5:
        case 6:
          result = this.paddingRight(hex.join(''), 6)
          break
      }
      return `#${result}`
    },
    delayedFinalize(formatedColor: string) {
      clearTimeout(this.finalizeTimer)
      this.finalizeTimer = setTimeout(() => {
        this.$emit('final', formatedColor)
      }, 500)
    }
  }
})
</script>

<style lang="scss" scoped>
.color-picker {
  display: flex;
  flex-direction: column;
  height: fit-content;
  background-color: white;
  &:focus {
    outline: none;
  }
  &__picker::v-deep {
    box-shadow: none;
  }
  &__hex {
    height: 40px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  &__input {
    width: 120px;
    display: grid;
    grid-template-rows: auto;
    grid-template-columns: auto 1fr;
    border: 1px solid setColor(gray-4);
    border-radius: 4px;
    padding: 4px 8px;
    box-sizing: border-box;
    > div {
      width: 20px;
      height: 20px;
      margin-right: 12px;
    }
    > input {
    }
  }

  &__colors {
    display: flex;
    flex-direction: column;
    align-items: center;
    > div:nth-child(1) {
      width: 100%;
      display: flex;
      justify-content: flex-start;
    }
    > div:nth-child(2) {
      display: grid;
      grid-auto-rows: 25px;
      grid-template-columns: repeat(7, 25px);
      row-gap: 5px;
      column-gap: 5px;
      justify-content: center;
      align-items: center;
      > div {
        width: 100%;
        height: 100%;
        border-radius: 2px;
      }
    }
  }
}
</style>
