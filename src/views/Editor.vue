<template lang="pug">
  div(class="editor")
    desktop-editor(v-if="true")
    mobile-editor(v-else)
</template>

<script lang="ts">
import DesktopEditor from '@/components/editor/editor/DesktopEditor.vue'
import MobileEditor from '@/components/editor/editor/MobileEditor.vue'

import Vue from 'vue'

export default Vue.extend({
  components: {
    DesktopEditor,
    MobileEditor
  }
})
</script>

<style lang="scss" scoped>
.editor {
  @include size(100%, 100%);
}
</style>
