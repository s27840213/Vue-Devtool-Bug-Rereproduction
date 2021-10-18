<template lang="pug">
  div(class="my-design")
    navigation-header(node="My Design")
    sidebar
    section
      component(:is="mydesignView" class="design-view")

</template>

<script lang="ts">
import Vue from 'vue'
import { mapGetters } from 'vuex'
import Sidebar from '@/components/navigation/mydesign/Sidebar.vue'
import NavigationHeader from '@/components/navigation/NavigationHeader.vue'
import AllDesignView from '@/components/navigation/mydesign/design-views/AllDesignView.vue'
import FavoriateDesignView from '@/components/navigation/mydesign/design-views/FavoriateDesignView.vue'
import TrashDesignView from '@/components/navigation/mydesign/design-views/TrashDesignView.vue'
import FolderDesignView from '@/components/navigation/mydesign/design-views/FolderDesignView.vue'

export default Vue.extend({
  name: 'MyDesgin',
  components: {
    Sidebar,
    NavigationHeader,
    AllDesignView,
    FavoriateDesignView,
    TrashDesignView,
    FolderDesignView
  },
  data() {
    return {
    }
  },
  computed: {
    ...mapGetters('design', {
      currentSelectedFolder: 'getCurrSelectedFolder'
    }),
    mydesignView(): string {
      switch (this.currentSelectedFolder[0]) {
        case 'a':
          return 'all-design-view'
        case 'h':
          return 'favoriate-design-view'
        case 't':
          return 'trash-design-view'
        case 'f':
          return 'folder-design-view'
        default:
          return 'all-design-view'
      }
    }
  },
  methods: {
  }
})
</script>

<style lang="scss" scoped>
.my-design {
  @include size(100%, 100%);
  max-height: 100%;
  display: grid;
  grid-template-rows: minmax(0, 1fr);
  grid-template-columns: auto 1fr;
}

.design-view {
  margin-top: 50px;
  height: calc(100% - 50px);
  width: 100%
}
</style>
