/* eslint-disable vue/no-unused-properties */
import stkWVUtils from '@/utils/stkWVUtils'
import { defineComponent } from 'vue'

export default defineComponent({
  computed: {
    controllerHidden(): boolean {
      return this.$isStk ? stkWVUtils.controllerHidden : false
    }
  }
})
