<template lang="pug">
div(class="coupon-input")
  input(v-model="coupon.input" @input="changeCoupon")
  span(:class="coupon.status==='error'?'text-red':'text-green-1'") {{coupon.msg}}
  button(v-if="coupon.status==='input'" @click="sendCoupon()") APPLY
  svg-icon(v-if="coupon.status==='loading'" iconName="loading"
          iconColor="gray-1" iconWidth="24px")
  animation(v-if="coupon.status==='accept'" :loop="false" :width="24"
            path="/lottie/correct.json" )
  svg-icon(v-if="coupon.status==='error'" iconName="info"
          iconColor="red" iconWidth="24px")
</template>

<script lang="ts">
import Vue from 'vue'
import { mapActions } from 'vuex'
import { createHelpers } from 'vuex-map-fields'
import Animation from '@/components/Animation.vue'

const { mapFields } = createHelpers({
  getterType: 'payment/getField',
  mutationType: 'payment/updateField'
})

export default Vue.extend({
  components: {
    Animation
  },
  computed: {
    ...mapFields({ coupon: 'coupon' })
  },
  mounted() {
    if (!this.coupon.input) {
      this.coupon.input = new URLSearchParams(window.location.search).get('coupon') || ''
    }
  },
  methods: {
    ...mapActions('payment', {
      verifyCoupon: 'verifyCoupon',
      clearCouponMsg: 'clearCouponMsg'
    }),
    sendCoupon() {
      this.verifyCoupon()
    },
    changeCoupon() {
      console.log('change')
      this.clearCouponMsg()
    }
  }
})
</script>

<style lang="scss" scoped>
.coupon-input {
  position: relative;
  input {
    @include body-SM;
    box-sizing: border-box;
    height: 40px;
    padding: 10px;
    border: 1px solid setColor(gray-4);
    border-radius: 4px;
  }

  button, .animation, .svg-icon {
    @include btn-SM;
    position: absolute;
    top: 8px;
    right: 8px;
    padding: 0;
  }

  span {
    @include body-XS;
  }
}
</style>
