<script lang="ts">
import PanelColor from '@nu/vivi-lib/components/editor/panelMobile/PanelColor.vue'
import ColorSlips from '@/components/editor/ColorSlips.vue'
import { defineComponent } from 'vue'

export default defineComponent({
  extends: PanelColor,
  components: {
    // ColorSlips is doesn't in vivi-lib, add it here.
    ColorSlips,
  },
})
</script>
