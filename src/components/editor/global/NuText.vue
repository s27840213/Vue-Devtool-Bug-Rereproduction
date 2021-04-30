<template lang="pug">
  div(class="nu-text")
    span(class="text-content" :style="contextStyles()" ref="content"
    @keydown="onKeyDown"
    @keyup="onKeyUp"
    @blur="onFocusOut") {{ config.text }}
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
    // 'config.textEditable': function(newVal) {
    //   if (newVal) {
    //     const el = this.$refs.content
    //     el.focus()
    //   }
    // }
  },
  computed: {
    getLayerX(): number {
      return this.config.styles.x
    },
    getLayerY(): number {
      return this.config.styles.y
    }
  },
  methods: {
    ...mapMutations({
      updateLayerProps: 'Update_layerProps',
      updateLayerStyles: 'Update_layerStyles'
    }),
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
    updateLayerInitWH(pageIndex: number, layerIndex: number, initWidth: number, initHeight: number) {
      this.updateLayerStyles({
        pageIndex,
        layerIndex,
        styles: {
          initWidth,
          initHeight
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
    contextStyles() {
      // const styles = Object.assign(this.config.styles, { size: this.config.styles.size * this.config.styles.scale })
      // console.log(styles.size)
      return CssConveter.convertFontStyle(this.config.styles)
    },
    onKeyDown(e) {
      if (e.keyCode === 13) {
        e.preventDefault()
        console.log('enter')
        // document.execCommand('insertHTML', false, '<br/>')
        const docFragment = document.createDocumentFragment()

        // add a new line
        let newEle = document.createTextNode('\n')
        docFragment.appendChild(newEle)

        // add the br, or p, or something else
        newEle = document.createElement('br')
        docFragment.appendChild(newEle)

        // make the br replace selection
        let range = window.getSelection().getRangeAt(0)
        range.deleteContents()
        range.insertNode(docFragment)

        // create a new range
        range = document.createRange()
        range.setStartAfter(newEle)
        range.collapse(true)

        // make the cursor there
        const sel = window.getSelection()
        sel.removeAllRanges()
        sel.addRange(range)

        if (this.$refs.content.lastChild.tagName !== 'BR') {
          const br = document.createElement('br')
          this.$refs.content.appendChild(br)
        }
      }
    },
    onKeyUp(e) {
      // const textHW = this.getTextHW()
      // const scaleX = textHW.width / this.config.styles.initWidth
      // const scaleY = textHW.height / this.config.styles.initHeight
      // console.log(scaleX)
      // console.log(scaleY)
      // this.updateLayerSizeXY(this.pageIndex, this.layerIndex, textHW.width, textHW.height, scaleX, scaleY)
      const textWH = this.getTextHW()
      const scale = textWH / this.config.styles.initWidth
      this.updateLayerInitWH(this.pageIndex, this.layerIndex, textWH.width, textWH.height)
      this.updateLayerSize(this.pageIndex, this.layerIndex, textWH.width, textWH.height, scale)
      console.log(this.config.styles.initWidth)
    },
    onFocusOut() {
      this.toggleTextEditable(this.pageIndex, this.layerIndex)
    },
    textNewLine(): number {
      const content = this.$refs.content.innerHTML
      const brs = content.match(/<br>/g)
      console.log(content.split(/<br>/))

      if (!brs) {
        return 1
      } else {
        return brs.length + 1
      }
    },
    getTextHW() {
      // const el = document.createElement('span')
      // const content = this.$refs.content.innerHTML
      // const sentences = content.split(/<br>/)
      // const maxTextLength = Math.max(...sentences.map(sentence => sentence.length))
      // const maxSentence = sentences.filter(sentence => sentence.length === maxTextLength)
      // el.textContnet = maxSentence

      // console.log('maxSentence')
      // console.log(maxSentence)
      // Object.assign(el.style, this.contextStyles())
      // document.body.appendChild(el)

      const textRect = this.$refs.content.getBoundingClientRect()
      const textHW = {
        width: textRect.width,
        height: textRect.height
      }
      // document.body.removeChild(el)

      return textHW
    },
    toggleTextEditable(pageIndex: number, layerIndex: number) {
      const props = {
        text: this.$refs.content.textContent,
        textEditable: false
      }
      this.updateTextProps(this.pageIndex, this.layerIndex, props)
    }
  }
})
</script>

<style lang="scss" scoped>
.nu-text {
  position: relative;
  text-align: left;
}
.text-content {
  position: absolute;
  display: inline-block;
  outline: none;
  white-space: nowrap;
  overflow-wrap: break-word;
}
</style>
