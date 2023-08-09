<template lang="pug">
div(class="panel-shadow")
  div(class="flex-between photo-shadow__options mb-10")
    div(v-for="icon in shadowOptions" :key="icon")
      svg-icon(
        :key="`shadow-${icon}`"
        :iconName="`mobile-photo-shadow-${icon}`"
        @click="onEffectClick(icon)"
        class="photo-shadow__options__option pointer"
        :class="{ 'photo-shadow__options__option--selected': currentEffect === icon }"
        iconWidth="56px"
        iconColor="gray-2")
      div(class="photo-shadow__options__option-font") {{$t(shadowPropI18nMap[icon]._effectName)}}
  div(class="photo-shadow__attrs" :style="shadowAttrsStyles")
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
        div(class="photo-shadow__color-name text-gray-3 body-2 no-wrap") {{$t('NN0017')}}
        div(class="photo-shadow__color"
          :style="{ backgroundColor: currentEffect === 'frame' ? currentStyle.shadow.effects.frameColor : currentStyle.shadow.effects.color || '#000000' }"
          @click="handleColorModal")
    div(v-if="currentEffect !== 'none'" class="photo-shadow__row-wrapper")
      div(class="photo-shadow__reset")
        button(class="label-mid" @click="imageShadowPanelUtils.reset()") {{$t('NN0754')}}
</template>

<script lang="ts">
import MobileSlider from '@/components/editor/mobile/MobileSlider.vue'
import { ShadowEffectType } from '@/interfaces/imgShadow'
import { IImage, IImageStyle } from '@/interfaces/layer'
import { ColorEventType, MobileColorPanelType } from '@/store/types'
import colorUtils from '@/utils/colorUtils'
import imageShadowPanelUtils from '@/utils/imageShadowPanelUtils'
import imageShadowUtils, { fieldRange, shadowPropI18nMap } from '@/utils/imageShadowUtils'
import layerUtils from '@/utils/layerUtils'
import { defineComponent } from 'vue'
import { mapGetters } from 'vuex'
export default defineComponent({
  components: {
    MobileSlider
  },
  emits: ['openExtraColorModal', 'toggleColorPanel'],
  data() {
    return {
      imageShadowPanelUtils,
      shadowPropI18nMap,
      fieldRange,
      handleColor: false
    }
  },
  mounted() {
    imageShadowPanelUtils.mount()
  },
  beforeUnmount() {
    if (colorUtils.currEvent !== ColorEventType.photoShadow) {
      imageShadowPanelUtils.handleShadowUpload()
      setTimeout(() => {
        const cb = (this.$store.getters['shadow/uploadingCallback'] as Map<string, () => void>).get(layerUtils.getCurrConfig.id)
        if (cb) {
          cb()
          this.$store.commit('shadow/SET_UPLOADING_CB', { id: layerUtils.getCurrConfig.id })
        }
      }, 300)
    }
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
    }
  },
  methods: {
    getFieldValue(field: string): number {
      return (this.currentStyle.shadow.effects as any)[this.currentEffect][field]
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

    &__option {
      margin-top: 10px;
      border-radius: 5px;
      border: 2px solid transparent;
      &--selected {
        border-color: setColor(black-5);
      }
      &-font {
        box-sizing: border-box;
        font-size: 10px;
      }
    }
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
    border: 1px solid #d9dbe1;
    width: 32px;
    height: 24px;
    box-sizing: border-box;
    line-height: 20px;
    border-radius: 3px;
    text-align: center;

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
    > button {
      color: setColor(black-3);
      font-size: 14px;
      padding: 0;
    }
  }
}
</style>
