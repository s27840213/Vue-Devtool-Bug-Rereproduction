<script lang="ts">
import Popup from '@nu/vivi-lib/components/popup/Popup.vue';
import PopupIcon from '@nu/vivi-lib/components/popup/PopupIcon.vue';
import { defineComponent } from 'vue';

export default defineComponent({
  extends: Popup,
  components: {
    PopupIcon,
  },
})
</script>
