<template lang="pug">
  div(v-if="type !== '0'" class="warning")
    div(v-if="size === 'small'" class="warning-small" :style="bgcolor")
      svg-icon(iconName="error" iconColor="white" iconWidth="24px")
      div(class="warning-small-title") {{cur.title}}
        div(class="warning-small-title-disk-total")
          div(class="warning-small-title-disk-used" :style="diskStyle")
      div(class="warning-small-desc") {{cur.desc}}
      svg-icon(iconName="close" iconColor="white"
              iconWidth="24px" @click.native="skip()")
    div(v-if="size === 'large'" class="warning-large" :style="bgcolor")
      div(class="warning-large-title") {{cur.title}}
      div(class="warning-large-desc") {{cur.desc}}
      div(class="warning-large-btn")
        btn(v-for="btn in cur.buttons" type="light-mid"
            @click.native="btn.func()") {{btn.text}}
</template>

<script lang="ts">
import Vue from 'vue'
import { mapActions, mapState } from 'vuex'
import i18n from '@/i18n'

export default Vue.extend({
  name: 'DiskWarning',
  components: {
  },
  props: {
    size: {
      type: String,
      required: true
    }
  },
  data() {
    return {
      skiped: localStorage.skipDiskWarning === '1'
    }
  },
  computed: {
    ...mapState('payment', {
      usage: 'usage'
    }),
    preset():Record<string, Record<string, unknown>> {
      return {
        0: { large: {}, small: {} },
        80: {
          title: i18n.t('TMP0133', { disk: this.usage.diskPercent * 100 }),
          desc: i18n.t('TMP0134'),
          bgcolor: '#FFBA49',
          large: {
            buttons: [
              {
                text: i18n.t('NN0271'),
                func: this.skip
              }, {
                text: i18n.t('TMP0058'),
                func: this.pro
              }
            ]
          },
          small: {
          }
        },
        100: {
          title: i18n.t('TMP0133', { disk: this.usage.diskPercent * 100 }),
          bgcolor: '#4EABE6',
          large: {
            desc: i18n.t('TMP0135'),
            buttons: [
              {
                text: i18n.t('TMP0137'),
                func: this.reload
              }, {
                text: i18n.t('TMP0138'),
                func: this.contact
              }
            ]
          },
          small: {
            desc: i18n.t('TMP0136')
          }
        }
      }
    },
    type():string {
      return this.usage.diskPercent >= 1
        ? '100'
        : this.skiped
          ? '0'
          : this.usage.diskPercent >= 0.8
            ? '80'
            : '0'
    },
    cur():Record<string, unknown> {
      const type = this.type
      const size = this.size as 'large' | 'small'
      return Object.assign(this.preset[type], this.preset[type][size])
    },
    bgcolor():Record<string, string> {
      return {
        'background-color': this.cur.bgcolor as string
      }
    },
    diskStyle():Record<string, string> {
      return { width: `${this.usage.diskPercent * 121}px` }
    }
  },
  // mounted() {
  // },
  methods: {
    ...mapActions({
      reload: 'payment/reloadDiskCapacity'
    }),
    skip() {
      console.log('skip')
      localStorage.setItem('skipDiskWarning', '1')
      this.skiped = true
    },
    pro() {
      this.$router.push('/pricing')
    },
    contact() {
      // this.$router.push('/pricing')
    }
  }
})
</script>

<style lang="scss" scoped>
.warning {
  @include body-SM;
  text-align: left;
  color: white;
}

.warning-small {
  display: flex;
  align-items: center;
  border-radius: 4px;
  >svg { margin: 8px; }
  &-title {
    @include caption-SM;
    font-size: 11px;
    transform: scale(1);
    width: 121px;
    margin: 0 3px;
    &-disk {
      &-total, &-used { height: 10px; }
      &-total {
        width: 121px;
        border: 1px solid setColor(white);
      }
      &-used {
        background-color: setColor(white);
      }
    }
  }
  &-desc { margin: 0 auto 0 18px; }
}

.warning-large {
  padding: 24px 4.4%;
  border-radius: 8px;
  &-title { @include caption-LG; }
  &-desc { margin: 8px 0 16px 0; }
  &-btn {
    display: flex;
    width: fit-content;
    margin-left: auto;
    >button {
      margin-left: 16px;
      border-radius: 50px;
      border: 1px solid setColor(white);;
    }
    >button:first-child {
      background-color: transparent;
      color: white
    }
  }
}
</style>
