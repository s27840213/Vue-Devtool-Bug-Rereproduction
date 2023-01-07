<template lang="pug">
  div(class="panel-shadow")
    div(class="flex-between photo-shadow__options mb-10")
      div(v-for="icon in shadowOptions")
        svg-icon(
          :key="`shadow-${icon}`"
          :iconName="`mobile-photo-shadow-${icon}`"
          @click.native="onEffectClick(icon)"
          class="photo-shadow__options__option pointer"
          :class="{ 'photo-shadow__options__option--selected': currentEffect === icon }"
          iconWidth="60px"
          iconColor="gray-2")
        div(class="photo-shadow__options__option-font") {{$t(shadowPropI18nMap[icon]._effectName)}}
    div(class="photo-shadow__attrs" :style="shadowAttrsStyles")
      div(v-for="field in shadowFields" :key="field")
        mobile-slider(:title="`${$t(shadowPropI18nMap[currentEffect][field])}`"
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
            :style="{ backgroundColor: currentStyle.shadow.effects.color || '#000000' }"
            @click="handleColorModal")
      div(v-if="currentEffect !== 'none'" class="photo-shadow__row-wrapper")
        div(class="photo-shadow__reset")
          button(class="label-mid" @click="imageShadowPanelUtils.reset()") {{$t('NN0754')}}
</template>
<script lang="ts">
import Vue from 'vue'
import MobileSlider from '@/components/editor/mobile/MobileSlider.vue'
import imageShadowUtils, { fieldRange, shadowPropI18nMap } from '@/utils/imageShadowUtils'
import { mapGetters, mapMutations, mapState } from 'vuex'
import { ShadowEffectType } from '@/interfaces/imgShadow'
import { IImage, IImageStyle } from '@/interfaces/layer'
import layerUtils from '@/utils/layerUtils'
import imageShadowPanelUtils from '@/utils/imageShadowPanelUtils'
import colorUtils from '@/utils/colorUtils'
import { ColorEventType, MobileColorPanelType } from '@/store/types'
import generalUtils from '@/utils/generalUtils'
export default Vue.extend({
  components: {
    MobileSlider
  },
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
  computed: {
    ...mapGetters({
      currSelectedInfo: 'getCurrSelectedInfo',
      currSelectedIndex: 'getCurrSelectedIndex',
      currSubSelectedInfo: 'getCurrSubSelectedInfo',
      currSelectedLayers: 'getCurrSelectedLayers'
    }),
    shadowOptions(): string[] {
      return Object.keys(this.effects)
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
    ...mapMutations({
      setCurrActivePanel: 'mobileEditor/SET_currActivePanel'
    }),
    getFieldValue(field: string): number | boolean {
      return (this.currentStyle.shadow.effects as any)[this.currentEffect][field]
    },
    onEffectClick(effectName: ShadowEffectType): void {
      const alreadySetEffect = effectName === ShadowEffectType.none || Object.keys((this.currentStyle.shadow as any).effects[effectName]).length
      imageShadowUtils.setEffect(effectName, {
        ...(!alreadySetEffect && imageShadowUtils.getDefaultEffect(effectName))
      })
    },
    handleEffectUpdate(value: string, name: string): void {
      imageShadowPanelUtils.handleEffectUpdate(name, value)
    },
    handleColorModal() {
      if (generalUtils.isTouchDevice()) {
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
    column-gap: 20px;
    overflow-x: scroll;
    @include no-scrollbar;

    &__option {
      min-width: 60px;
      box-sizing: border-box;
      margin-top: 10px;
      border-radius: 5px;
      border: 2px solid transparent;
      &:not(&--selected):hover {
        border-color: setColor(blue-1, 0.5);
      }
      &--selected {
        border-color: setColor(blue-1);
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
      padding: 0.375rem 0.625rem;
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
    row-gap: 5px;
    overflow: scroll;
    @include no-scrollbar;
  }
  &__reset {
    > button {
      color: setColor(blue-1);
      font-size: 14px;
      padding: 0;
    }
  }
}
</style>
