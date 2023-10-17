<template>
  <div
    role="application"
    aria-label="Chrome color picker"
    :class="['vc-chrome', disableAlpha ? 'vc-chrome__disable-alpha' : '']"
    :style="pickerStyles"
  >
    <div class="vc-chrome-saturation-wrap" :style="saturationWrapStyles">
      <saturation :value="colors" @change="childChange"></saturation>
    </div>
    <div class="vc-chrome-body" :style="bodyPadding">
      <div class="vc-chrome-controls">
        <div class="vc-chrome-color-wrap" :style="colorWrapStyles">
          <div
            v-if="!isMobile"
            :aria-label="`current color is ${colors.hex}`"
            class="vc-chrome-active-color"
            :style="{ background: activeColor }"
          ></div>
          <checkboard v-if="!disableAlpha"></checkboard>
        </div>

        <div class="vc-chrome-sliders">
          <div class="vc-chrome-hue-wrap">
            <hue :value="colors" @change="childChange"></hue>
          </div>
          <div class="vc-chrome-alpha-wrap" v-if="!disableAlpha">
            <alpha :value="colors" @change="childChange"></alpha>
          </div>
        </div>
      </div>

      <div class="vc-chrome-fields-wrap" v-if="!disableFields">
        <div class="vc-chrome-fields" v-show="fieldsIndex === 0">
          <div class="vc-chrome-field">
            <ed-in
              v-if="!hasAlpha"
              label="hex"
              :value="colors.hex"
              @change="inputChange"
            ></ed-in>
            <ed-in
              v-if="hasAlpha"
              label="hex"
              :value="colors.hex8"
              @change="inputChange"
            ></ed-in>
          </div>
        </div>
        <div class="vc-chrome-fields" v-show="fieldsIndex === 1">
          <div class="vc-chrome-field">
            <ed-in
              label="r"
              :value="colors.rgba.r"
              @change="inputChange"
            ></ed-in>
          </div>
          <div class="vc-chrome-field">
            <ed-in
              label="g"
              :value="colors.rgba.g"
              @change="inputChange"
            ></ed-in>
          </div>
          <div class="vc-chrome-field">
            <ed-in
              label="b"
              :value="colors.rgba.b"
              @change="inputChange"
            ></ed-in>
          </div>
          <div class="vc-chrome-field" v-if="!disableAlpha">
            <ed-in
              label="a"
              :value="colors.a"
              :arrow-offset="0.01"
              :max="1"
              @change="inputChange"
            ></ed-in>
          </div>
        </div>
        <div class="vc-chrome-fields" v-show="fieldsIndex === 2">
          <div class="vc-chrome-field">
            <ed-in label="h" :value="hsl.h" @change="inputChange"></ed-in>
          </div>
          <div class="vc-chrome-field">
            <ed-in label="s" :value="hsl.s" @change="inputChange"></ed-in>
          </div>
          <div class="vc-chrome-field">
            <ed-in label="l" :value="hsl.l" @change="inputChange"></ed-in>
          </div>
          <div class="vc-chrome-field" v-if="!disableAlpha">
            <ed-in
              label="a"
              :value="colors.a"
              :arrow-offset="0.01"
              :max="1"
              @change="inputChange"
            ></ed-in>
          </div>
        </div>
        <div
          class="vc-chrome-toggle-btn"
          role="button"
          aria-label="Change another color definition"
          @click="toggleViews"
        >
          <div class="vc-chrome-toggle-icon">
            <svg
              style="width: 24px; height: 24px"
              viewBox="0 0 24 24"
              @mouseover="showHighlight"
              @mouseenter="showHighlight"
              @mouseout="hideHighlight"
            >
              <path
                fill="#333"
                d="M12,18.17L8.83,15L7.42,16.41L12,21L16.59,16.41L15.17,15M12,5.83L15.17,9L16.58,7.59L12,3L7.41,7.59L8.83,9L12,5.83Z"
              />
            </svg>
          </div>
          <div class="vc-chrome-toggle-icon-highlight" v-show="highlight"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import editableInput from './common/EditableInput.vue'
import saturation from './common/Saturation.vue'
import hue from './common/Hue.vue'
import alpha from './common/Alpha.vue'
import checkboard from './common/Checkboard.vue'
import { defineComponent } from 'vue'
import { TinyColor } from '@ctrl/tinycolor'

function tinycolor (...args) {
  return new TinyColor(...args)
}

function _colorChange (data, oldHue) {
  const alpha = data && data.a
  let color

  // hsl is better than hex between conversions
  if (data && data.hsl) {
    color = tinycolor(data.hsl)
  } else if (data && data.hex && data.hex.length > 0) {
    color = tinycolor(data.hex)
  } else if (data && data.hsv) {
    color = tinycolor(data.hsv)
  } else if (data && data.rgba) {
    color = tinycolor(data.rgba)
  } else if (data && data.rgb) {
    color = tinycolor(data.rgb)
  } else {
    color = tinycolor(data)
  }

  if (color && (color._a === undefined || color._a === null)) {
    color.setAlpha(alpha || 1)
  }

  const hsl = color.toHsl()
  const hsv = color.toHsv()

  if (hsl.s === 0) {
    hsv.h = hsl.h = data.h || (data.hsl && data.hsl.h) || oldHue || 0
  }

  /* --- comment this block to fix #109, may cause #25 again --- */
  // when the hsv.v is less than 0.0164 (base on test)
  // because of possible loss of precision
  // the result of hue and saturation would be miscalculated
  // if (hsv.v < 0.0164) {
  //   hsv.h = data.h || (data.hsv && data.hsv.h) || 0
  //   hsv.s = data.s || (data.hsv && data.hsv.s) || 0
  // }

  // if (hsl.l < 0.01) {
  //   hsl.h = data.h || (data.hsl && data.hsl.h) || 0
  //   hsl.s = data.s || (data.hsl && data.hsl.s) || 0
  // }
  /* ------ */
  return {
    hsl: hsl,
    hex: color.toHexString().toUpperCase(),
    hex8: color.toHex8String().toUpperCase(),
    rgba: color.toRgb(),
    hsv: hsv,
    oldHue: data.h || oldHue || hsl.h,
    source: data.source,
    a: data.a || color.getAlpha()
  }
}

export default defineComponent({
  name: 'Chrome',
  props: {
    value: {
      required: true
    },
    pickerWidth: {
      type: Number,
      default: 225
    },
    fullWidth: {
      type: Boolean,
      default: false
    },
    disableAlpha: {
      type: Boolean,
      default: false
    },
    disableFields: {
      type: Boolean,
      default: false
    },
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
    saturation,
    hue,
    alpha,
    checkboard,
    'ed-in': editableInput
  },
  data() {
    return {
      fieldsIndex: 0,
      highlight: false,
      val: _colorChange(this.value)
    }
  },
  computed: {
    colors: {
      get () {
        return this.val
      },
      set (newVal) {
        this.val = newVal
        this.$emit('input', newVal)
      }
    },
    hsl() {
      const { h, s, l } = this.colors.hsl
      return {
        h: h.toFixed(),
        s: `${(s * 100).toFixed()}%`,
        l: `${(l * 100).toFixed()}%`
      }
    },
    activeColor() {
      const rgba = this.colors.rgba
      return 'rgba(' + [rgba.r, rgba.g, rgba.b, rgba.a].join(',') + ')'
    },
    hasAlpha() {
      return this.colors.a < 1
    },
    pickerStyles() {
      return {
        width: this.fullWidth ? '100%' : `${this.pickerWidth}px`
      }
    },
    bodyPadding() {
      return this.isMobile ? {
        padding: '12px 0px 0px'
      } : {
        padding: '12px 12px 12px'
      }
    },
    colorWrapStyles() {
      return this.isMobile ? {
        width: '0px'
      } : {
      }
    },
    saturationWrapStyles() {
      return this.isMobile ? {
        paddingBottom: `${this.aspectRatio}%`,
        borderRadius: '5px'
      } : {
        paddingBottom: `${this.aspectRatio}%`,
        borderRadius: '2px 2px 0 0'
      }
    }
  },
  watch: {
    value: {
      handler (newVal) {
        this.val = _colorChange(newVal)
      },
      deep: true
    }
  },
  methods: {
    colorChange (data, oldHue) {
      this.oldHue = this.colors.hsl.h
      this.colors = _colorChange(data, oldHue || this.oldHue)
    },
    isValidHex (hex) {
      return tinycolor(hex).isValid()
    },
    // eslint-disable-next-line vue/no-unused-properties
    simpleCheckForValidColor (data) {
      const keysToCheck = ['r', 'g', 'b', 'a', 'h', 's', 'l', 'v']
      let checked = 0
      let passed = 0

      for (let i = 0; i < keysToCheck.length; i++) {
        const letter = keysToCheck[i]
        if (data[letter]) {
          checked++
          if (!isNaN(data[letter])) {
            passed++
          }
        }
      }

      if (checked === passed) {
        return data
      }
    },
    // eslint-disable-next-line vue/no-unused-properties
    paletteUpperCase (palette) {
      return palette.map(c => c.toUpperCase())
    },
    // eslint-disable-next-line vue/no-unused-properties
    isTransparent (color) {
      return tinycolor(color).getAlpha() === 0
    },
    childChange(data) {
      this.colorChange(data)
    },
    inputChange(data) {
      if (!data) {
        return
      }
      if (data.hex) {
        this.isValidHex(data.hex) && this.colorChange({
          hex: data.hex,
          source: 'hex'
        })
      } else if (data.r || data.g || data.b || data.a) {
        this.colorChange({
          r: data.r || this.colors.rgba.r,
          g: data.g || this.colors.rgba.g,
          b: data.b || this.colors.rgba.b,
          a: data.a || this.colors.rgba.a,
          source: 'rgba'
        })
      } else if (data.h || data.s || data.l) {
        const s = data.s ? (data.s.replace('%', '') / 100) : this.colors.hsl.s
        const l = data.l ? (data.l.replace('%', '') / 100) : this.colors.hsl.l

        this.colorChange({
          h: data.h || this.colors.hsl.h,
          s,
          l,
          source: 'hsl'
        })
      }
    },
    toggleViews() {
      if (this.fieldsIndex >= 2) {
        this.fieldsIndex = 0
        return
      }
      this.fieldsIndex++
    },
    showHighlight() {
      this.highlight = true
    },
    hideHighlight() {
      this.highlight = false
    }
  }
})
</script>

<style>
.vc-chrome {
  background: #fff;
  border-radius: 2px;
  box-sizing: initial;
  font-family: Menlo;
  background-color: #fff;
  display: flex;
  flex-direction: column;
}
.vc-chrome-controls {
  display: flex;
}
.vc-chrome-color-wrap {
  position: relative;
  width: 36px;
}
.vc-chrome-active-color {
  position: relative;
  width: 30px;
  height: 30px;
  border-radius: 15px;
  overflow: hidden;
  z-index: 1;
}
.vc-chrome-color-wrap .vc-checkerboard {
  width: 30px;
  height: 30px;
  border-radius: 15px;
  background-size: auto;
}
.vc-chrome-sliders {
  flex: 1;
}
.vc-chrome-fields-wrap {
  display: flex;
  padding-top: 16px;
}
.vc-chrome-fields {
  display: flex;
  margin-left: -6px;
  flex: 1;
}
.vc-chrome-field {
  padding-left: 6px;
  width: 100%;
}
.vc-chrome-toggle-btn {
  width: 32px;
  text-align: right;
  position: relative;
}
.vc-chrome-toggle-icon {
  margin-right: -4px;
  margin-top: 12px;
  cursor: pointer;
  position: relative;
  z-index: 2;
}
.vc-chrome-toggle-icon-highlight {
  position: absolute;
  width: 24px;
  height: 28px;
  background: #eee;
  border-radius: 4px;
  top: 10px;
  left: 12px;
}
.vc-chrome-hue-wrap {
  position: relative;
  height: 10px;
  margin-bottom: 8px;
}
.vc-chrome-alpha-wrap {
  position: relative;
  height: 10px;
}
.vc-chrome-hue-wrap .vc-hue {
  border-radius: 5px;
}
.vc-chrome-alpha-wrap .vc-alpha-gradient {
  border-radius: 2px;
}
.vc-chrome-hue-wrap .vc-hue-picker,
.vc-chrome-alpha-wrap .vc-alpha-picker {
  width: 12px;
  height: 12px;
  border-radius: 6px;
  transform: translate(-6px, -2px);
  background-color: rgb(248, 248, 248);
  box-shadow: 0 1px 4px 0 rgba(0, 0, 0, 0.37);
}
.vc-chrome-body {
  background-color: #fff;
}
.vc-chrome-saturation-wrap {
  width: 100%;
  position: relative;
  overflow: hidden;
}
.vc-chrome-saturation-wrap .vc-saturation-circle {
  width: 12px;
  height: 12px;
}

.vc-chrome-fields .vc-input__input {
  font-size: 11px;
  color: #333;
  width: 100%;
  border-radius: 2px;
  border: none;
  box-shadow: inset 0 0 0 1px #dadada;
  height: 20px;
  text-align: center;
}
.vc-chrome-fields .vc-input__label {
  text-transform: uppercase;
  font-size: 11px;
  line-height: 11px;
  color: #969696;
  text-align: center;
  display: block;
  margin-top: 12px;
}

.vc-chrome__disable-alpha .vc-chrome-active-color {
  width: 18px;
  height: 18px;
}
.vc-chrome__disable-alpha .vc-chrome-color-wrap {
  width: 30px;
}
.vc-chrome__disable-alpha .vc-chrome-hue-wrap {
  margin-top: 4px;
  margin-bottom: 4px;
}
</style>
