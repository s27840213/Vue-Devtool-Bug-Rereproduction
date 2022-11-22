<template lang="pug">
  div(v-if="showWarning" class="warning")
    div(v-if="size === 'small' && !dismissed" class="warning-small" :style="bgcolor")
      svg-icon(iconName="error" iconColor="white" iconWidth="24px")
      div(class="warning-small-title")
        span(class="caption-SM") {{cur.title}}
        div(class="warning-small-title-disk-total")
          div(class="warning-small-title-disk-used" :style="diskStyle")
      i18n(:path="cur.small.desc" class="warning-small-desc" tag="div")
        template(#button)
          span(class="warning-small-desc__btn" @click="cur.small.func") {{cur.small.buttonLabel}}
      svg-icon(iconName="close" iconColor="white"
              iconWidth="24px" @click.native="close()")
    div(v-if="size === 'large'" class="warning-large" :style="bgcolor")
      div(class="caption-LG") {{cur.title}}
      div(class="warning-large-desc") {{cur.large.desc}}
      div(class="warning-large-btn")
        btn(v-for="btn in cur.large.buttons" :type="btn.type || 'light-mid'"
            :disabled="btn.disabled" @click.native="btn.func()") {{btn.label}}
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { mapActions, mapGetters, mapState } from 'vuex'
import i18n from '@/i18n'
import paymentUtils from '@/utils/paymentUtils'

export default defineComponent({
  name: 'DiskWarning',
  props: {
    size: {
      type: String,
      required: true
    }
  },
  data() {
    return {
      skiped: localStorage.skipDiskWarning === '1',
      dismissed: false
    }
  },
  computed: {
    ...mapState('payment', {
      isPro: 'isPro',
      usage: 'usage'
    }),
    ...mapGetters({
      _diskPercent: 'payment/getDiskPercent',
      isAdmin: 'user/isAdmin'
    }),
    showWarning(): boolean {
      return !this.cur.hidden && !this.isAdmin
    },
    diskPercent(): string {
      return (this._diskPercent * 100).toFixed(0)
    },
    recalc(): string {
      return (this.usage.diskLoading ? i18n.t('NN0454') : i18n.t('NN0641')) as string
    },
    preset(): Record<string, Record<string, Record<string, unknown>>> {
      return {
        pro: {
          0: { hidden: true },
          80: { hidden: true },
          100: {
            title: i18n.t('NN0635', { disk: this.diskPercent }),
            bgcolor: '#4EABE6',
            large: {
              desc: i18n.t('NN0639'),
              buttons: [{
                label: this.recalc,
                func: this.reload,
                disabled: this.usage.diskLoading,
                type: 'transparent-mid'
              }, {
                label: i18n.t('NN0642'),
                func: this.contact
              }]
            },
            small: {
              desc: 'NN0640',
              buttonLabel: i18n.t('NN0642'),
              func: this.contact
            }
          }
        },
        free: {
          0: { hidden: true },
          80: {
            title: i18n.t('NN0635', { disk: this.diskPercent }),
            bgcolor: '#FFBA49',
            large: {
              desc: i18n.t('NN0636', { button: i18n.t('NN0561') }),
              buttons: [{
                label: i18n.t('NN0271'),
                func: this.skip,
                type: 'transparent-mid'
              }, {
                label: i18n.t('NN0561'),
                func: this.openPaymentPopup
              }]
            },
            small: {
              desc: 'NN0636',
              buttonLabel: i18n.tc('NN0507', 1),
              func: this.openPaymentPopup
            }
          },
          100: {
            title: i18n.t('NN0635', { disk: this.diskPercent }),
            bgcolor: '#4EABE6',
            large: {
              desc: i18n.t('NN0637'),
              buttons: [{
                label: this.recalc,
                func: this.reload,
                disabled: this.usage.diskLoading,
                type: 'transparent-mid'
              }, {
                label: i18n.t('NN0561'),
                func: this.openPaymentPopup
              }]
            },
            small: {
              desc: 'NN0638',
              buttonLabel: i18n.tc('NN0507', 1),
              func: this.openPaymentPopup
            }
          }
        }
      }
    },
    type(): string {
      return this._diskPercent > 1
        ? '100'
        : this._diskPercent >= 0.8
          ? '80'
          : '0'
    },
    cur(): Record<string, unknown> {
      const plan = this.isPro ? 'pro' : 'free'
      const type = this.skiped && !this.isPro && this.type === '80' && this.size === 'large' ? '0' : this.type
      return this.preset[plan][type]
    },
    bgcolor(): Record<string, string> {
      return { 'background-color': this.cur.bgcolor as string }
    },
    diskStyle(): Record<string, string> {
      return { width: `${Math.min(1, this._diskPercent) * 100}%` }
    }
  },
  methods: {
    ...mapActions({
      reload: 'payment/reloadDiskCapacity'
    }),
    skip() {
      localStorage.setItem('skipDiskWarning', '1')
      this.skiped = true
    },
    close() { this.dismissed = true },
    contact() { paymentUtils.contactUs() },
    openPaymentPopup() { paymentUtils.openPayment('step1') }
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
  padding: 5px 0 5px 4px;
  border-radius: 4px;
  > svg {
    margin: 8px;
    flex-shrink: 0;
  }
  &-title {
    flex-shrink: 0;
    width: 130px;
    margin: 0 3px;
    &-disk {
      &-total,
      &-used {
        height: 10px;
      }
      &-total {
        border: 1px solid setColor(white);
      }
      &-used {
        background-color: setColor(white);
      }
    }
  }
  &-desc {
    margin: 0 auto 0 18px;
    &__btn {
      text-decoration: underline;
      cursor: pointer;
    }
  }
}

.warning-large {
  padding: 24px 4.4%;
  border-radius: 8px;
  &-desc {
    margin: 8px 0 16px 0;
  }
  &-btn {
    display: flex;
    justify-content: flex-end;
    > button {
      margin-left: 16px;
      border-radius: 50px;
      border: 1px solid setColor(white);
    }
  }
}
</style>
