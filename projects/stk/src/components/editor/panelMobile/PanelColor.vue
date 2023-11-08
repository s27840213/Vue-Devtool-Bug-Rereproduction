<script lang="ts">
import ColorSlips from '@nu/vivi-lib/components/editor/ColorSlips.vue';
import PanelColor from '@nu/vivi-lib/components/editor/panelMobile/PanelColor.vue';
import { defineComponent } from 'vue';

export default defineComponent({
  extends: PanelColor,
  components: {
    // ColorSlips is stk version, add it here.
    ColorSlips,
  },
})
</script>
