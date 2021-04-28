<template lang="pug">
  div(class="nu-text")
    span(class="text-content" :style="contextStyles()" ref="content"
    contenteditable=true
    @keyup="onKeyUp"
    @click="onClick"
    @blur="onFocusOut") {{ textContent }}
</template>

<script lang="ts">
import Vue from 'vue'
import CssConveter from '@/utils/cssConverter'
import { mapMutations } from 'vuex'
export default Vue.extend({
  props: {
    config: Object,
    pageIndex: Number,
    layerIndex: Number
  },
  data() {
    return {
      textContent: this.config.text
    }
  },
  watch: {
    'config.textEditable': function(newVal) {
      console.log('watch this.config.text:' + this.config.text)
      console.log('watch textContent:' + this.textContent)
      if (newVal) {
        const el = this.$refs.content
        el.focus()
        const ev = document.createEvent('MouseEvent')
        var event = new MouseEvent('click', {
          view: window,
          clientX: 919,
          clientY: 410,
          bubbles: true
        })
        el.dispatchEvent(event)
        // const el = this.$refs.content as HTMLElement
        // const x = el.getBoundingClientRect().x
        // const y = el.getBoundingClientRect().y
        // console.log('testing---')
        // console.log('x' + x)
        // console.log('y' + y)
        // document.elementFromPoint(x, y).click()
        // this.$refs.content.click()
      }
    }
  },
  computed: {
    getLayerX(): number {
      return this.config.styles.x
    },
    getLayerY(): number {
      return this.config.styles.y
    }
  },
  mounted() {
    const textHW = this.getTextHW()
    const scaleX = textHW.width / this.config.styles.initWidth
    const scaleY = textHW.height / this.config.styles.initHeight
    this.updateLayerSizeXY(this.pageIndex, this.layerIndex, textHW.width, textHW.height, scaleX, scaleY)
  },
  methods: {
    ...mapMutations({
      updateLayerProps: 'Update_layerProps',
      updateLayerStyles: 'Update_layerStyles'
    }),
    contextStyles() {
      return CssConveter.convertFontStyle(this.config.styles)
    },
    onClick(e: MouseEvent) {
      console.log(e)
    },
    getTextHW() {
      const el = document.createElement('span')
      el.textContent = this.$refs.content.textContent
      Object.assign(el.style, this.contextStyles())
      document.body.appendChild(el)
      const textHW = {
        width: el.offsetWidth,
        height: el.offsetHeight
      }
      document.body.removeChild(el)
      return textHW
    },
    updateTextProps(pageIndex: number, layerIndex: number, props: { [key: string]: string | number | boolean }) {
      this.updateLayerProps({
        pageIndex,
        layerIndex,
        props
      })
    },
    updateLayerSize(pageIndex: number, layerIndex: number, width: number, height: number, scale: number) {
      this.updateLayerStyles({
        pageIndex,
        layerIndex,
        styles: {
          width,
          height,
          scale
        }
      })
    },
    updateLayerSizeXY(pageIndex: number, layerIndex: number, width: number, height: number, scaleX: number, scaleY: number) {
      this.updateLayerStyles({
        pageIndex,
        layerIndex,
        styles: {
          width,
          height,
          scaleX,
          scaleY
        }
      })
    },
    updateLayerPos(pageIndex: number, layerIndex: number, x: number, y: number) {
      this.updateLayerStyles({
        pageIndex,
        layerIndex,
        styles: { x, y }
      })
    },
    onKeyUp(e) {
      // const textHW = this.getTextHW()
      // const scaleX = textHW.width / this.config.styles.initWidth
      // const scaleY = textHW.height / this.config.styles.initHeight
      // console.log(scaleX)
      // console.log(scaleY)
      // this.updateLayerSizeXY(this.pageIndex, this.layerIndex, textHW.width, textHW.height, scaleX, scaleY)
      if (e.keyCode === 13) {
        console.log('enter')
      }
      const textWH = this.getTextHW()
      const scale = textWH / this.config.styles.initWidth
      this.updateLayerSize(this.pageIndex, this.layerIndex, textWH.width, textWH.height, scale)
    },
    toggleTextEditable(pageIndex: number, layerIndex: number) {
      const props = {
        text: this.$refs.content.textContent,
        textEditable: false
      }
      console.log(props.text)
      this.updateTextProps(this.pageIndex, this.layerIndex, props)
    },
    onFocusOut() {
      this.toggleTextEditable(this.pageIndex, this.layerIndex)
    }
  }
})
</script>

<style lang="scss" scoped>
.nu-text {
  text-align: left;
}
.text-content {
  position: absolute;
  display: inline-block;
  outline: none;
  white-space: pre-wrap;
  overflow-wrap: break-word;
}
</style>
