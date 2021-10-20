<template lang="pug">
  div(class="my-design")
    nu-header
    div(class="my-design__content")
      sidebar
      section
        component(:is="mydesignView" class="design-view")

</template>

<script lang="ts">
import Vue from 'vue'
import { mapGetters } from 'vuex'
import Sidebar from '@/components/navigation/mydesign/Sidebar.vue'
import NuHeader from '@/components/NuHeader.vue'
import AllDesignView from '@/components/navigation/mydesign/design-views/AllDesignView.vue'
import FavoriteDesignView from '@/components/navigation/mydesign/design-views/FavoriteDesignView.vue'
import TrashDesignView from '@/components/navigation/mydesign/design-views/TrashDesignView.vue'
import FolderDesignView from '@/components/navigation/mydesign/design-views/FolderDesignView.vue'

export default Vue.extend({
  name: 'MyDesgin',
  components: {
    Sidebar,
    NuHeader,
    AllDesignView,
    FavoriteDesignView,
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
          return 'favorite-design-view'
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
  &__content {
    height: calc(100% - 50px);
    display: grid;
    grid-template-rows: minmax(0, 1fr);
    grid-template-columns: auto 1fr;
  }
}

.design-view {
  height: 100%;
  width: 100%
}
</style>
