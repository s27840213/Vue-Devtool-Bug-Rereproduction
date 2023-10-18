<template lang="pug">
div(class="no-items-hint" :class="{mobile: mobile}")
  div(v-if="mobile" class="no-items-hint__icon")
    svg-icon(:iconName="hints[type].icon" iconColor="white" iconWidth="42px")
  span(class="no-items-hint__title" :class="{mobile: mobile}") {{ $t('NN0659', { items: hints[type].items }) }}
  p(class="no-items-hint__description" :class="{mobile: mobile}")
    span {{ $t('NN0662') }}
    svg-icon(iconName="settings" :iconColor="mobile ? 'gray-3' : 'white'" iconWidth="16px")
  span(class="no-items-hint__description" :class="{mobile: mobile}")
    span {{ hints[type].action }}
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'

export default defineComponent({
  emits: [],
  props: {
    type: {
      type: String as PropType<'logo' | 'color'>,
      required: true
    },
    mobile: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      hints: {
        logo: {
          items: this.$t('NN0660'),
          action: this.$t('NN0663'),
          icon: 'cloud-upload'
        },
        color: {
          items: this.$t('NN0661'),
          action: this.$t('NN0664'),
          icon: 'color'
        }
      }
    }
  }
})
</script>

<style lang="scss" scoped>
.no-items-hint {
  margin-top: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  &__icon {
    width: 42px;
    height: 42px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 10px;
  }
  &.mobile {
    margin: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }
  &__title {
    @include overline-LG;
    letter-spacing: 0.8px;
    color: white;
    &.mobile {
      @include text-H6;
      letter-spacing: 0;
      margin-bottom: 14px;
    }
  }
  &__description {
    margin: 0;
    @include body-SM;
    color: white;
    &.mobile {
      color: setColor(gray-3);
      & > svg {
        margin-left: 4px;
        transform: translateY(3px);
      }
    }
    & > svg {
      margin-left: 4px;
      transform: translateY(2px);
    }
  }
}
</style>
