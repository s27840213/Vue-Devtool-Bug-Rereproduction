<template lang="pug">
div(class="panel-shadow")
  div(class="flex-between photo-shadow__options mb-10")
    div(v-for="icon in shadowOptions" :key="icon"
        :class="[`photo-shadow-${icon}`, {'selected': currentEffect === icon}]"
        @click="onEffectClick(icon)")
      //- class photo-shadow-<icon> is for Cypress to query, don't remove it
      div(class="photo-shadow__options__icon-bg")
      svg-icon(v-if="icon === 'none'"
            iconName="no-effect"
            iconWidth="24px"
            class="photo-shadow__options--icon" :iconColor="theme === 'dark' ? 'white' : 'black-2'")
      img(v-else :src="imgSrc(icon)"
        class="photo-shadow__options--icon"
        width="56"
        height="56")
  div(class="photo-shadow__attrs" :style="shadowAttrsStyles")
    span(class="photo-shadow__effect-name") {{$t(shadowPropI18nMap[currentEffect]._effectName)}}
    div(v-for="field in shadowFields" :key="field")
      mobile-slider(:title="`${$t(shadowPropI18nMap[currentEffect][field] as string)}`"
        :borderTouchArea="true"
        :name="field"
        :value="getFieldValue(field)"
        :max="fieldRange[currentEffect][field].max"
        :min="fieldRange[currentEffect][field].min"
        @update="handleEffectUpdate")
    div(v-if="!['none', 'imageMatched'].includes(currentEffect)" class="photo-shadow__row-wrapper")
      div(class="photo-shadow__row")
        div(class="photo-shadow__color-name body-2 no-wrap" :class="$isStk ? 'text-white' : 'text-gray-2'") {{$t('NN0017')}}
        color-btn(class="photo-shadow__color"
                  :color="(currentEffect === 'frame' ? currentStyle.shadow.effects.frameColor : currentStyle.shadow.effects.color) || '#000000'"
                  size="30px" @click="handleColorModal")
    div(v-if="currentEffect !== 'none'" class="photo-shadow__row-wrapper")
      nubtn(class="photo-shadow__reset"
            theme="icon_pill"
            icon="reset"
            @click="imageShadowPanelUtils.reset()") {{$t('NN0754')}}
</template>

<script lang="ts">
import MobileSlider from '@/components/editor/mobile/MobileSlider.vue'
import ColorBtn from '@/components/global/ColorBtn.vue'
import { ShadowEffectType } from '@/interfaces/imgShadow'
import { IImage, IImageStyle } from '@/interfaces/layer'
import { ColorEventType, FunctionPanelType, MobileColorPanelType } from '@/store/types'
import colorUtils from '@/utils/colorUtils'
import imageShadowPanelUtils from '@/utils/imageShadowPanelUtils'
import imageShadowUtils, { fieldRange, shadowPropI18nMap } from '@/utils/imageShadowUtils'
import layerUtils from '@/utils/layerUtils'
import { defineComponent } from 'vue'
import { mapGetters } from 'vuex'

export default defineComponent({
  components: {
    MobileSlider,
    ColorBtn,
  },
  emits: ['openExtraColorModal', 'toggleColorPanel', 'uploadShadow'],
  data() {
    return {
      imageShadowPanelUtils,
      shadowPropI18nMap,
      fieldRange,
      handleColor: false,
      theme: this.$isStk || this.$isCm ? 'dark' : 'light',
    }
  },
  mounted() {
    imageShadowPanelUtils.mount()
  },
  beforeUnmount() {
    if ((this.$isStk || this.$isCm) && colorUtils.currEvent !== ColorEventType.photoShadow) {
      imageShadowPanelUtils.handleShadowUpload()
      setTimeout(() => {
        const cb = (this.$store.getters['shadow/uploadingCallback'] as Map<string, () => void>).get(layerUtils.getCurrConfig.id)
        if (cb) {
          cb()
          this.$store.commit('shadow/SET_UPLOADING_CB', { id: layerUtils.getCurrConfig.id })
        }
      }, 300)
    }
    this.$store.commit('SET_currFunctionPanelType', FunctionPanelType.none)
  },
  computed: {
    ...mapGetters({
      currSelectedInfo: 'getCurrSelectedInfo',
      currSelectedIndex: 'getCurrSelectedIndex',
      currSubSelectedInfo: 'getCurrSubSelectedInfo',
      currSelectedLayers: 'getCurrSelectedLayers'
    }),
    shadowOptions(): ShadowEffectType[] {
      return Object.keys(this.effects) as ShadowEffectType[]
    },
    shadowFields(): string[] {
      const { effects, currentEffect } = this
      return effects[currentEffect]
    },
    currentStyle(): IImageStyle {
      const { styles } = layerUtils.getCurrConfig as IImage
      return styles || {}
    },
    currentEffect(): ShadowEffectType {
      const { shadow } = this.currentStyle as IImageStyle
      if (shadow) {
        return shadow.currentEffect || ShadowEffectType.none
      }
      return ShadowEffectType.none
    },
    effects(): { [key: string]: string[] } {
      return {
        none: [],
        shadow: imageShadowUtils.getKeysOf(ShadowEffectType.shadow),
        blur: imageShadowUtils.getKeysOf(ShadowEffectType.blur),
        imageMatched: imageShadowUtils.getKeysOf(ShadowEffectType.imageMatched),
        frame: imageShadowUtils.getKeysOf(ShadowEffectType.frame),
        floating: imageShadowUtils.getKeysOf(ShadowEffectType.floating)
      }
    },
    shadowAttrsStyles(): { [key: string]: string } {
      return {
        'max-height': this.currentEffect === ShadowEffectType.none ? '0' : '1000px'
      }
    },
    iconBgColor(): string {
      return (this.theme === 'dark' ? colorUtils.colorMap.get('black-3') : colorUtils.colorMap.get('gray-5')) ?? 'white'
    }
  },
  methods: {
    getFieldValue(field: string): number {
      return (this.currentStyle.shadow.effects as any)[this.currentEffect][field]
    },
    imgSrc(icon: string): string {
      return require(`@img/photo-shadow/${this.theme}_icon/photo-shadow-${icon}.png`)
    },
    onEffectClick(effectName: ShadowEffectType): void {
      const alreadySetEffect = effectName === ShadowEffectType.none || Object.keys((this.currentStyle.shadow as any).effects[effectName]).length
      if (!alreadySetEffect) {
        const data = imageShadowUtils.getLocalEffectAttrs(effectName) || (imageShadowUtils.getDefaultEffect(effectName) as any)[effectName]
        const color = imageShadowUtils.getLocalEffectColor(effectName) || '#000000'
        if (effectName === ShadowEffectType.frame) {
          imageShadowUtils.setEffect(effectName, { [effectName]: data, frameColor: color })
        } else {
          imageShadowUtils.setEffect(effectName, { [effectName]: data, color })
        }
      } else {
        if (effectName === ShadowEffectType.frame) {
          const color = this.currentStyle.shadow.effects.frameColor || this.currentStyle.shadow.effects.color || '#000000'
          imageShadowUtils.setEffect(effectName, { frameColor: color })
        } else {
          imageShadowUtils.setEffect(effectName, {})
        }
      }
    },
    handleEffectUpdate(value: string, name: string): void {
      imageShadowPanelUtils.handleEffectUpdate(name, value)
    },
    handleColorModal() {
      if (this.$isTouchDevice()) {
        colorUtils.setCurrEvent(ColorEventType.photoShadow)
        this.handleColor = true
        this.$emit('openExtraColorModal', ColorEventType.photoShadow, MobileColorPanelType.palette)
      }
    }
  }
})
</script>

<style lang="scss" scoped>
.panel-shadow {
  display: flex;
  flex-flow: column;
  padding: 0 5px;
  width: 100%;
  height: 100%;
}

.photo-shadow {
  &__options {
    display: flex;
    flex-shrink: 0;
    padding: 0 2px; // For first/last icon border space.
    column-gap: 20px;
    overflow-x: scroll;
    @include no-scrollbar;

    > div {
      flex-shrink: 0;
      display: flex;
      justify-content: center;
      align-items: center;
      position: relative;
      width: 56px;
      height: 56px;
      margin: 0px auto;
      border-radius: 5px;
      overflow: hidden;
      box-sizing: border-box;
      transition: border 0.3s;
      &.selected {
        @include setColors(blue-1, white) using ($color) {
          border: 2px solid $color;
        }
        > img, > svg {
          transform: scale(0.85);
        }
        > div {
          border-radius: 3px;
          width: 47.6px;
          height: 47.6px;
        }
      }
      .photo-shadow__options--icon {
        border-radius: 5px;
        object-fit: cover;
        pointer-events: none;
      }
    }
    &__icon-bg {
      z-index: -1;
      border-radius: 5px;
      background-color: v-bind(iconBgColor);
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 56px;
      height: 56px;
      transition: width 0.3s, height 0.3s;
    }
  }

  &__effect-name {
    @include body-SM;
    @include setColors(gray-1, white) using ($color) {
      color: $color;
    }
    text-align: center;
  }

  &__row {
    display: flex;
    justify-content: space-between;
    align-items: center;

    &-wrapper {
      width: 100%;
      box-sizing: border-box;
    }
  }

  &__color {
    &-name {
      text-align: left;
      text-transform: capitalize;
      white-space: nowrap;
    }
  }

  &__attrs {
    // transition: max-height 1s ease-out;
    display: flex;
    flex-direction: column;
    row-gap: 10px;
    overflow: scroll;
    @include no-scrollbar;
  }
  &__reset {
    margin: 6px auto 0;
  }
}
</style>
