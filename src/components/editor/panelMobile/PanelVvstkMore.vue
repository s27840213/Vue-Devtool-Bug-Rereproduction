<template lang="pug">
  div(class="panel-vvstk-more")
    template(v-if="inInitialState")
      div(class="panel-vvstk-more__options")
        div(v-for="option in mainOptions"
            class="panel-vvstk-more__option"
            @click.prevent.stop="handleOptionAction(option.action)")
          div(class="panel-vvstk-more__option-icon")
            svg-icon(:iconName="option.icon"
                      iconWidth="24px"
                      iconColor="gray-2")
          div(class="panel-vvstk-more__option-title") {{ option.text }}
      div(class="horizontal-rule")
      div(class="panel-vvstk-more__option version")
        div(class="panel-vvstk-more__option-icon")
          svg-icon(iconName="vivisticker__version"
                    iconWidth="24px"
                    iconColor="gray-3")
        span(class="panel-vvstk-more__option-title version") {{ `${$t('NN0743')} : ${'v. 1.0'} ${'v. 1.0'}` }}
    template(v-if="lastHistory === 'locale'")
      div(class="panel-vvstk-more__options")
        div(v-for="option in localeOptions"
            class="panel-vvstk-more__option"
            @click.prevent.stop="handleOptionAction(option.action)")
          div(class="panel-vvstk-more__option-icon")
            svg-icon(:iconName="option.icon"
                      iconWidth="24px"
                      iconColor="gray-2")
          div(class="panel-vvstk-more__option-title") {{ option.text }}
</template>

<script lang="ts">
import editorUtils from '@/utils/editorUtils'
import Vue, { PropType } from 'vue'
import { mapGetters, mapMutations } from 'vuex'

type OptionConfig = {
  text: string
  icon: string
  action?: () => void
}

export default Vue.extend({
  data() {
    return {
    }
  },
  props: {
    panelHistory: {
      type: Array as PropType<string[]>,
      default: () => []
    }
  },
  computed: {
    mainOptions(): OptionConfig[] {
      return [{
        text: `${this.$t('NN0146')}`,
        icon: 'vivisticker_play-circle'
      }, {
        text: `${this.$t('NN0174')}`,
        icon: 'vivisticker_global',
        action: this.handleLocaleList
      }, {
        text: `${this.$t('NN0147')}`,
        icon: 'vivisticker_info'
      }, {
        text: `${this.$t('NN0742')}`,
        icon: 'vivisticker_mail'
      }]
    },
    localeOptions(): OptionConfig[] {
      return [{
        text: 'English',
        icon: 'vivisticker_global'
      }, {
        text: '繁體中文',
        icon: 'vivisticker_global'
      }, {
        text: '日本語',
        icon: 'vivisticker_global'
      }]
    },
    historySize(): number {
      return this.panelHistory.length
    },
    inInitialState(): boolean {
      return this.historySize === 0
    },
    lastHistory(): string {
      return this.panelHistory[this.historySize - 1]
    }
  },
  methods: {
    handleOptionAction(action?: () => void) {
      if (action) {
        action()
      }
    },
    handleLocaleList() {
      this.$emit('pushHistory', 'locale')
    }
  }
})
</script>

<style lang="scss" scoped>
.panel-vvstk-more {
  padding: 0 0 8px 0;
  &__options {
    display: flex;
    flex-direction: column;
  }
  &__option {
    height: 40px;
    padding: 0 24px;
    display: flex;
    gap: 16px;
    align-items: center;
    justify-content: start;
    &:not(.version):active {
      background: setColor(gray-4);
    }
  }
  &__option-icon {
    @include size(24px);
    display: flex;
    align-items: center;
    justify-content: center;
  }
  &__option-title {
    @include body-SM;
    color: setColor(gray-2);
    &.version {
      color: setColor(gray-3);
    }
  }
}

.horizontal-rule {
  height: 1px;
  background-color: setColor(gray-4);
  width: calc(100% - 32px);
  margin-top: 8px;
  margin-bottom: 8px;
  margin-left: auto;
  margin-right: auto;
}
</style>
