<template lang="pug">
  div(class="no-items-hint")
    span(class="no-items-hint__title") {{ $t('NN0659', { items: hints[type].items }) }}
    p(class="no-items-hint__description")
      span {{ $t('NN0662') }}
      svg-icon(iconName="settings" iconColor="white" iconWidth="16px")
    span(class="no-items-hint__description")
      span {{ hints[type].action }}
</template>

<script lang="ts">
import Vue from 'vue'

export default Vue.extend({
  props: {
    type: String
  },
  data() {
    return {
      hints: {
        logo: {
          items: this.$t('NN0660'),
          action: this.$t('NN0663')
        },
        color: {
          items: this.$t('NN0661'),
          action: this.$t('NN0664')
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
  align-content: center;
  &__title {
    @include overline-LG;
    letter-spacing: 0.8px;
    color: white;
  }
  &__description {
    margin: 0;
    @include body-SM;
    color: white;
    & > svg {
      margin-left: 4px;
      transform: translateY(2px);
    }
  }
}
</style>
