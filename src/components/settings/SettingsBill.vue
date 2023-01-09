<template lang="pug">
  div(class="bill")
    div(class="bill__title") {{$t('NN0614')}}
    template(v-if="!historys.length")
      img(:src="require('@/assets/img/svg/pricing/E-payment.svg')")
      p(class="text-H6") {{$t('NN0621')}}
    div(v-else class="bill-table")
      span {{$t('NN0615')}}
      span {{$t('NN0616')}}
      span {{$t('NN0617')}}
      span {{$t('NN0618')}}
      template(v-for="his, idx in historys")
        div {{his.date}}
        div(class="bill-table-description")
          span {{his.description}}
          span(class="body-XS text-gray-3") {{his.couponCentent}}
        div {{his.price}}
        div(v-if="!his.success" class="text-red")
          span {{$t('NN0620')}}
          svg-icon(iconName="error" iconWidth="24px" iconColor="red")
        div(v-else-if="canDownloadInvoice(his)" class="text-blue-1 pointer" @click="pdf(idx, his)")
          span {{$t('NN0619')}}
          svg-icon(iconName="download" iconWidth="24px" iconColor="gray-2")
        span(v-else)
    //- observer-sentinel(@callback="getBillingHistroy")
    //- For Stripe invoice pdf generation
    div(v-if="historys.length" class="bill-invoice-wrapper")
      div(class="bill-invoice" id="bill-invoice")
        div(class="bill-invoice__title")
          img(:src="require('@/assets/img/jpg/logo.jpg')" style="height: 32px;")
          span {{'INVOICE'}}
        div {{`Invoice number: ${curInvoice.id}`}}
        div {{`Invoice date: ${curInvoice.date}`}}
        div(class="bill-invoice-fromto")
          span {{'From:'}}
          span {{'To:'}}
          span {{'Artily, Inc.\n651 N Broad St, Ste 206\nMiddletown, Delaware 19709-6402 US\nservice@vivipic.com'}}
          span {{customerAddr}}
        div(class="bill-invoice-detail")
          span {{'Descriptions'}}
          span {{'Date'}}
          span {{'Price'}}
          template(v-for="item in curInvoice.items")
            span {{item.description}}
            span {{item.date}}
            span {{item.price}}
          span
          span(class="caption-LG") {{'Total price'}}
          span(class="caption-LG") {{`$${totalPrice} USD`}}
        div(class="caption-LG mt-50")
          span {{'NOTE'}}
    spinner(v-if="isLoading")
</template>

<script lang="ts">
import Vue from 'vue'
import { mapActions, mapMutations, mapState } from 'vuex'
import * as type from '@/interfaces/payment'
// import ObserverSentinel from '@/components/ObserverSentinel.vue'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import html2pdf from 'html2pdf.js'

export default Vue.extend({
  name: 'SettingsBill',
  // components: {
  //   ObserverSentinel
  // },
  data() {
    return {
      hisIndex: 0
    }
  },
  computed: {
    ...mapState('payment', {
      historys: 'billingHistory',
      isLoading: 'isLoading'
    }),
    curInvoice(): type.IBillingHistory {
      return this.historys[this.hisIndex]
    },
    customerAddr(): string {
      return [
        this.curInvoice.name,
        this.curInvoice.company,
        this.curInvoice.address,
        this.curInvoice.email
      ].filter((item) => item !== '')
        .join('\n')
    },
    totalPrice(): number {
      return this.curInvoice.items
        .reduce((acc, cur) => {
          return acc + (cur.price as number)
        }, 0)
    }
  },
  mounted() {
    this.getBillingHistroy()
  },
  methods: {
    ...mapActions({
      getBillingHistroy: 'payment/getBillingHistroy'
    }),
    ...mapMutations({
      setIsLoading: 'payment/SET_isLoading'
    }),
    canDownloadInvoice(his: type.IBillingHistory): boolean {
      return (['tappay', 'tcloud'].includes(his.payType) && his.url !== '') || his.payType === 'stripe'
    },
    async pdf(index: number, his: type.IBillingHistory) {
      if (['tappay', 'tcloud'].includes(his.payType)) {
        location.href = his.url
        return
      }

      this.setIsLoading(true)
      this.hisIndex = index
      const invoice = document.getElementById('bill-invoice')
      const opt = {
        html2canvas: { scale: 5 },
        jsPDF: { format: [160, 226.42] }
      }
      // html2pdf will freeze page, so sleep 100ms for showing loading spinner.
      await new Promise(resolve => setTimeout(resolve, 100))
      await html2pdf().set(opt).from(invoice).toPdf().save(this.curInvoice.id)
      this.setIsLoading(false)
    }
  }
})
</script>

<style lang="scss" scoped>
.bill {
  @include body-SM;
  padding: 60px 13% 20px 13%;
  color: setColor(gray-1);
  &__title {
    @include body-MD;
    color: setColor(blue-1);
    text-align: left;
    margin-bottom: 23px;
  }
  &-table {
    display: grid;
    grid-template-columns: 5fr 5fr 5fr 3fr;
    align-items: center;
    &-description {
      display: flex;
      flex-direction: column;
    }
    > span {
      height: 45px;
    }
    > span:nth-child(4n + 1), div:nth-child(4n + 1) {
      text-align: left;
    }
    > span:nth-child(-n + 4) {
      color: setColor(gray-3);
    }
    > div > svg {
      display: none;
    }
  }
}

// Comment this class rule to show invoice on screen.
.bill-invoice-wrapper {
  // Pdf print nothing if target element use fixed.
  position: fixed;
  bottom: 100%;
}

.bill-invoice {
  @include body-XS;
  display: flex;
  flex-direction: column;
  width: 525px;
  height: 752px;
  margin: 35px 45px;
  white-space: pre;
  text-align: left;
  &__title {
    @include text-H4;
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
  }
  &-fromto {
    display: grid;
    grid-template-columns: 1fr 1fr;
    margin: 10px 0 30px 0;
  }
  &-detail {
    display: grid;
    grid-template-columns: 232px 180px 88px;
    text-align: center;
    > span:nth-child(-n + 3) {
      color: setColor(gray-3);
      background-color: setColor(gray-6);
    }
    > span:nth-child(3n + 1),
    > span:nth-child(3n + 2) {
      padding-right: 100px;
    }
  }
}

@media screen and (max-width: 768px) {
  .bill {
    padding: 24px 6.4%;
  }
  .bill-table > div {
    > span {
      display: none;
    }
    > svg {
      display: inline;
    }
  }
}
</style>
