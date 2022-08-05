<template lang="pug">
  div(class="editor")
    desktop-editor(v-if="!useMobileEditor")
    mobile-editor(v-else)
    spinner(v-if="isLoading || isSaving || isGlobalLoading" :textContent="isSaving ? $t('NN0455') : $t('NN0454')")
</template>

<script lang="ts">
import DesktopEditor from '@/components/editor/editor/DesktopEditor.vue'
import MobileEditor from '@/components/editor/editor/MobileEditor.vue'
import logUtils from '@/utils/logUtils'
import stepsUtils from '@/utils/stepsUtils'
import uploadUtils from '@/utils/uploadUtils'

import Vue from 'vue'
import { mapGetters, mapMutations } from 'vuex'

export default Vue.extend({
  components: {
    DesktopEditor,
    MobileEditor
  },
  data() {
    return {
      isSaving: false
    }
  },
  computed: {
    ...mapGetters({
      useMobileEditor: 'getUseMobileEditor'
    })
  },
  beforeRouteLeave(to, from, next) {
    // const answer = this.confirmLeave()
    // if (!answer) {
    //   next(false)
    //   return
    // }

    stepsUtils.clearSteps()
    if (uploadUtils.isLogin && this.$router.currentRoute.query.design_id && this.$router.currentRoute.query.type) {
      this.isSaving = true
      uploadUtils.uploadDesign(uploadUtils.PutAssetDesignType.UPDATE_BOTH).then(() => {
        uploadUtils.isGettingDesign = false
        logUtils.setLog('Leave editor')
        this.isSaving = false
        this.clearState()
        next()
      })
    } else {
      logUtils.setLog('Leave editor')
      this.clearState()
      next()
    }
  },
  methods: {
    ...mapMutations({
      setCurrFunctionPanel: 'SET_currFunctionPanelType',
      _setAdminMode: 'user/SET_ADMIN_MODE',
      clearState: 'CLEAR_state',
      clearBgRemoveState: 'bgRemove/CLEAR_bgRemoveState'
    })
  }
})
</script>

<style lang="scss" scoped>
.editor {
  @include size(100%, 100%);
}
</style>
