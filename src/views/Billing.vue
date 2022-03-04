<template lang="pug">
  div(class="billing")
    div(class="billing-content")
      div(class="billing-content__input" id="card-number")
      div(class="billing-content__input" id="card-expiration-date")
      div(class="billing-content__input" id="card-ccv")
      btn(class="billing-content__input rounded"
        :type="'primary-mid'"
        :disabled="!canGetPrime"
        @click.native="getPrime") 送出
      div(id="prime") {{showPrime}}
    spinner(v-if="isLoading")
</template>

<script lang="ts">
import Vue from 'vue'

export default Vue.extend({
  name: 'Editor',
  components: {
  },
  data() {
    return {
      isLoading: false,
      prime: {},
      canGetPrime: false,
      TPDirect: (window as any).TPDirect
    }
  },
  watch: {
  },
  mounted() {
    this.TPDirect.setupSDK(122890, 'app_vCknZsetHXn07bficr2XQdp7o373nyvvxNoBEm6yIcqgQGFQA96WYtUTDu60', 'sandbox')

    const fields = {
      number: {
        element: '#card-number',
        placeholder: '**** **** **** ****'
      },
      expirationDate: {
        element: '#card-expiration-date',
        placeholder: 'MM / YY'
      },
      ccv: {
        element: '#card-ccv',
        placeholder: 'ccv'
      }
    }

    this.TPDirect.card.setup({
      fields: fields,
      styles: {
        input: {
          color: 'gray',
          'font-size': '28px'
        },
        ':focus': {
          color: 'black'
        },
        '.valid': {
          color: 'green'
        },
        '.invalid': {
          color: 'red'
        }
      }
    })

    this.TPDirect.card.onUpdate((update: any) => {
      this.canGetPrime = update.canGetPrime

      // cardTypes = ['mastercard', 'visa', 'jcb', 'amex', 'unknown']
      if (update.cardType === 'visa') {
        // Handle card type visa.
      }

      // number fields is error
      if (update.status.number === 2) {
        // setNumberFormGroupToError()
      } else if (update.status.number === 0) {
        // setNumberFormGroupToSuccess()
      } else {
        // setNumberFormGroupToNormal()
      }

      if (update.status.expiry === 2) {
        // setNumberFormGroupToError()
      } else if (update.status.expiry === 0) {
        // setNumberFormGroupToSuccess()
      } else {
        // setNumberFormGroupToNormal()
      }

      if (update.status.ccv === 2) {
        // setNumberFormGroupToError()
      } else if (update.status.ccv === 0) {
        // setNumberFormGroupToSuccess()
      } else {
        // setNumberFormGroupToNormal()
      }
    })
  },
  computed: {
    showPrime():string {
      return Object.entries(this.prime).map(this.printPrime).join('\n')
    }
  },
  methods: {
    printPrime(item: [string, unknown], index: number, array: [string, unknown][], prefix = ''):string {
      if (typeof item[1] === 'object') {
        return Object.entries(item[1] as any).map((v, i, a) =>
          this.printPrime(v, i, a, `${prefix}${item[0]}.`)).join('\n')
      }
      return `${prefix}${item.join(': ')}`
    },
    getPrime() {
      this.TPDirect.card.getPrime((result: any) => {
        if (result.status !== 0) {
          console.log('getPrime error')
          return
        }
        this.prime = result
        console.log('getPrime success: ' + this.prime)
      })
    }
  }
})
</script>

<style lang="scss" scoped>
.billing-content {
  display: flex;
  flex-direction: column;
  width: 80%;
  margin: auto;
  &__input {
    margin: auto;
    height: 50px;
  }
}

#prime{
  white-space: pre;
  text-align: left;
}
</style>
