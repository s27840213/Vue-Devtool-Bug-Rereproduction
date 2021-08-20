<template lang="pug">
  div(class="color-picker" ref="colorPicker")
    chrome-picker(
      class="color-picker__picker"
      :value="convertedHex"
      @input="updateHex"
      :disableFields="true"
      :disableAlpha="true")
    div(class="px-10 pb-20")
      div(class="color-picker__hex")
        span(class="body-1") Hex
        div(class="color-picker__input")
          div(:style="{'background-color': convertedHex}")
          input(
            ref="input"
            type="text"
            spellcheck="false"
            v-model="color"
            maxlength="7")
        //- svg-icon(class="pointer"
        //- :iconName="'color-picker'" :iconWidth="'20px'" :iconColor="'gray-2'")
      div(class="color-picker__colors")
        div(class="text-left")
          span(class="body-1") Brand Kit
        div
          div(v-for="color in brandColors"
            class="pointer"
            :style="colorStyles(color)")
          svg-icon(class="pointer"
            :iconName="'plus'"
            :iconColor="'gray-2'"
            :iconWidth="'18px'"
            @click.native="addNewBrandColor(color)")
      div(class="color-picker__colors")
        div(class="text-left")
          span(class="body-1") Document color
        div
          div(v-for="color in documentColors"
            class="pointer"
            :style="colorStyles(color)"
            @click="setColor(color)")
      div(class="color-picker__colors")
        div(class="text-left")
          span(class="body-1") Default color
        div
          div(v-for="color in defaultColors"
            class="pointer"
            :style="colorStyles(color)"
            @click="setColor(color)")
</template>

<script lang="ts">
import Vue from 'vue'
import { Chrome } from 'vue-color'

export default Vue.extend({
  props: {
    currentColor: String
  },
  components: {
    'chrome-picker': Chrome
  },
  data() {
    return {
      color: this.currentColor || '#194d33',
      brandColors: ['#2D9CDB'],
      documentColors: ['#2D9CDB', '#56CCF2', '#9B51E0', '#BB6BD9', '#4F4F4F', '#828282', '#F2F2F2'],
      defaultColors: ['#EB5757', '#F2994A', '#F2C94C', '#219653', '#27AE60', '#6FCF97', '#2F80ED', '#2D9CDB', '#56CCF2', '#9B51E0', '#BB6BD9', '#4F4F4F', '#828282', '#F2F2F2']
    }
  },
  mounted() {
    const root = this.$refs.colorPicker as HTMLElement
    root.focus()
    const input = this.$refs.input as HTMLInputElement
    input.select()
  },
  computed: {
    convertedHex(): string {
      let hex = this.color.slice(1).split('')
      let result = ''
      const len = hex.length
      switch (len) {
        case 0: {
          result = '000000'
          break
        }
        case 1: {
          hex = hex.map((val: string) => val + val)
          result = this.paddingRight(hex.join(''), 6)
          break
        }
        case 2: {
          hex = hex.map((val: string) => val + val)
          result = this.paddingRight(hex.join(''), 6)
          break
        }
        case 3: {
          hex = hex.map((val: string) => val + val)
          result = this.paddingRight(hex.join(''), 6)
          break
        }
        case 4: {
          result = this.paddingRight(hex.join(''), 6)
          break
        }
        case 5: {
          result = this.paddingRight(hex.join(''), 6)
          break
        }
        case 6: {
          result = this.paddingRight(hex.join(''), 6)
          break
        }
      }
      console.log('#' + result)
      this.$emit('update', `#${result}`)
      return `#${result}`
    }
  },
  watch: {
    color(): void {
      if (this.color.length === 0) {
        this.color = '#'
      }
    }
  },
  methods: {
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
    colorStyles(color: string) {
      return {
        backgroundColor: color
      }
    },
    addNewBrandColor(color: string) {
      if (!this.brandColors.includes(color)) {
        this.brandColors.push(color)
      }
    },
    setColor(color: string) {
      this.color = color
      this.$emit('update', color)
    }
  }
})
</script>

<style lang="scss" scoped>
.color-picker {
  display: flex;
  flex-direction: column;
  width: 225px;
  box-shadow: 0 0 2px rgba(0, 0, 0, 0.3), 0 4px 8px rgba(0, 0, 0, 0.3);
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
