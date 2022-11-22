<template lang="pug">
div(class="coupon-input")
  input(v-model="coupon.input" @input="changeCoupon" :invalid="coupon.status==='error'"
        @paste="pasteCoupon()" :placeholder="$t('NN0700')")
  span(:class="coupon.status==='error'?'text-red':'text-green-1'") {{coupon.msg}}
  button(v-if="coupon.status==='input' && coupon.input!==''" @click="sendCoupon()") {{$t('NN0703')}}
  svg-icon(v-if="coupon.status==='loading'" iconName="loading"
          iconColor="gray-1" iconWidth="24px")
  animation(v-if="coupon.status==='accept'" :loop="false" :width="24"
            path="/lottie/correct.json" )
  svg-icon(v-if="coupon.status==='error'" iconName="info"
          iconColor="red" iconWidth="24px")
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { mapActions } from 'vuex'
import { createHelpers } from 'vuex-map-fields'
import Animation from '@/components/Animation.vue'

const { mapFields } = createHelpers({
  getterType: 'payment/getField',
  mutationType: 'payment/updateField'
})

export default defineComponent({
  components: {
    Animation
  },
  computed: {
    ...mapFields({ coupon: 'coupon' })
  },
  mounted() {
    if (!this.coupon.input) {
      this.coupon.input = new URLSearchParams(window.location.search).get('coupon') || ''
      this.coupon.input && this.sendCoupon()
    }
  },
  methods: {
    ...mapActions('payment', {
      verifyCoupon: 'verifyCoupon',
      resetCouponResult: 'resetCouponResult'
    }),
    pasteCoupon() {
      setTimeout(this.sendCoupon, 10)
    },
    sendCoupon() {
      this.verifyCoupon()
    },
    changeCoupon() {
      this.resetCouponResult()
    }
  }
})
</script>

<style lang="scss" scoped>
input {
  @include default-input;
}

.coupon-input {
  position: relative;
  input {
    padding-right: 50px;
  }
  button, .animation, .svg-icon {
    @include btn-SM;
    position: absolute;
    top: 10px;
    right: 8px;
    padding: 0;
  }
  button {
    color: setColor(blue-1);
    text-transform: uppercase;
  }
  span {
    @include body-XS;
  }
}
</style>
