<template lang="pug">
  div(class="bill")
    div(class="bill__title")
      p {{$t('TMP0106')}}
    template(v-if="!historys.length")
      img(:src="require('@/assets/img/svg/pricing/E-payment.svg')")
      p(class="text-H6") {{$t('TMP0112')}}
    div(v-else class="bill-table")
      span {{$t('TMP0107')}}
      span {{$t('TMP0108')}}
      span {{$t('TMP0109')}}
      span {{$t('TMP0110')}}
      template(v-for="his, idx in historys")
        span {{his.date}}
        span {{his.description}}
        span {{his.price}}
        span(class="text-blue-1 pointer" @click="pdf(idx)") {{$t('TMP0111')}}
    div(v-if="historys.length" class="bill-invoice-wrapper")
      div(class="bill-invoice" id="bill-invoice")
        div(class="bill-invoice__title")
          //- svg-icon(iconName="logo" iconWidth="143px" style="height: 50px;")
          img(:src="require('@/assets/img/jpg/logo.jpg')" style="height: 32px;")
          span {{'INVOICE'}}
        div(class="bill-invoice__invoice-number") {{`Invoice number: ${historys[hisIndex].id}`}}
        div(class="bill-invoice__invoice-date") {{`Invoice date: ${historys[hisIndex].date}`}}
        div(class="bill-invoice-fromto")
          //- todo reuse
          span {{'From:'}}
          span {{'Vivipic Ltd'}}
          span {{'vivipic addr'}}
          span {{'vivipic zipcode city?'}}
          span {{'vivipic mail'}}
          span {{'To:'}}
          span {{historys[hisIndex].name}}
          span {{historys[hisIndex].address}}
          span {{historys[hisIndex].email}}
        div(class="bill-invoice-detail")
          span {{'Descriptions'}}
          span {{'Date'}}
          span {{'Price'}}
          template(v-for="item in historys[hisIndex].items")
            span {{item.description}}
            span {{item.date}}
            span {{item.price}}
          span
          span {{'Total price'}}
          span {{'$13.09 USD'}}
        div(class="bill-invoice-note")
          span {{'NOTE'}}
</template>

<script lang="ts">
import Vue from 'vue'
import { mapActions, mapState } from 'vuex'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import html2pdf from 'html2pdf.js'

export default Vue.extend({
  name: 'SettingsBill',
  components: {
  },
  props: {
  },
  data() {
    return {
      hisIndex: 0
    }
  },
  computed: {
    ...mapState('payment', {
      historys: 'billingHistory'
    })
  },
  mounted() {
    this.getBillingHistroy()
  },
  methods: {
    ...mapActions({
      getBillingHistroy: 'payment/getBillingHistroy'
    }),
    pdf(index: number) {
      this.hisIndex = index
      const invoice = document.getElementById('bill-invoice')
      const opt = {
        html2canvas: { scale: 5 },
        jsPDF: { format: [160, 226.42] }
      }
      html2pdf().set(opt).from(invoice).toPdf().save()
    }
  }
})
</script>

<style lang="scss" scoped>
.bill {
  @include body-SM;
  padding: 60px 13% 20px 13%;
  &__title {
    @include body-MD;
    color: setColor(blue-1);
    text-align: left;
  }
  &-table {
    display: grid;
    grid-template-columns: 5fr 5fr 5fr 3fr;
    >span { height: 45px; }
    >span:nth-child(4n+1) { text-align: left; }
    >span:nth-child(-n+4) { color: setColor(gray-3); }
  }
}

// Comment this class rule to show invoice on screen.
.bill-invoice-wrapper { // Pdf print nothing if target element use fixed.
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
  text-align: left;
  color: setColor(gray-1);
  &__title {
    @include text-H4;
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
  }
  &-fromto {
    display: grid;
    grid-auto-flow: column;
    grid-template-rows: repeat(5, 1fr);
    margin: 10px 0 30px 0;
  }
  &-detail {
    display: grid;
    grid-template-columns: 232px 180px 88px;
    text-align: center;
    >span { margin: auto 0; }
    >span:nth-child(-n+3) {
      color: setColor(gray-3);
      background-color: setColor(gray-6);
    }
    >span:nth-child(3n+1), >span:nth-child(3n+2) { padding-right: 100px; }
    >span:nth-last-child(-n+2) { font-weight: bold; }
  }
  &-note { margin-top: 50px; }
}
</style>
