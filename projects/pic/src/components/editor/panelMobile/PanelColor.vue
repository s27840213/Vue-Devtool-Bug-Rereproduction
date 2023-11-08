<script lang="ts">
import ColorSlips from '@/components/editor/ColorSlips.vue';
import PanelColor from '@nu/vivi-lib/components/editor/panelMobile/PanelColor.vue';
import { defineComponent } from 'vue';

export default defineComponent({
  extends: PanelColor,
  components: {
    // ColorSlips is not in vivi-lib, add it here.
    ColorSlips,
  },
})
</script>
