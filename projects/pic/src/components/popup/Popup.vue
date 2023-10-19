<script lang="ts">
import Popup from '@nu/vivi-lib/components/popup/Popup.vue'
import PopupAlign from '@/components/popup/PopupAlign.vue'
import PopupDeleteAccount from '@/components/popup/PopupDeleteAccount.vue'
import PopupFile from '@/components/popup/PopupFile.vue'
import PopupFlip from '@/components/popup/PopupFlip.vue'
import PopupGuideline from '@/components/popup/PopupGuideline.vue'
import PopupLayer from '@/components/popup/PopupLayer.vue'
import PopupLineTemplate from '@/components/popup/PopupLineTemplate.vue'
import PopupOrder from '@/components/popup/PopupOrder.vue'
import PopupPage from '@/components/popup/PopupPage.vue'
import PopupPageScale from '@/components/popup/PopupPageScale.vue'
import PopupPayment from '@/components/popup/PopupPayment.vue'
import PopupReplace from '@/components/popup/PopupReplace.vue'
import PopupSlider from '@/components/popup/PopupSlider.vue'
import PopupSubmit from '@/components/popup/PopupSubmit.vue'
import { defineComponent } from 'vue'

export default defineComponent({
  extends: Popup,
  components: {
    PopupOrder,
    PopupLayer,
    PopupAlign,
    PopupPage,
    PopupFlip,
    PopupSlider,
    PopupFile,
    PopupLineTemplate,
    PopupGuideline,
    PopupPageScale,
    PopupSubmit,
    PopupPayment,
    PopupDeleteAccount,
    PopupReplace,
  },
})
</script>
