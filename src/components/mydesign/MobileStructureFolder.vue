<template lang="pug">
  section
    div(:class="[`nav-folder-${level}`, {'bg-blue-4': folder.isCurrLocation}]"
        :title="folder.name"
        @click="handleSelection")
      svg-icon(iconName="folder"
          iconColor="gray-2"
          iconWidth="24px"
          style="pointer-events: none")
      div(:class="`nav-folder-${level}__text`"
          style="pointer-events: none")
          span {{ folder.name }}
      div(class="nav-folder__expand-icon-container"
          @click.stop="toggleExpansion")
        svg-icon(class="nav-folder__expand-icon"
            iconName="chevron-left"
            iconColor="gray-2"
            iconWidth="24px"
            :style="expandIconStyles()")
    mobile-structure-folder(v-for="subFolder in checkExpand(realFolders)"
                    :folder="subFolder" :level="level+1"
                    :parents="[...parents, folder.id]")
</template>
<script lang="ts">
import Vue from 'vue'
import { IFolder } from '@/interfaces/design'
import designUtils from '@/utils/designUtils'
import { mapActions, mapMutations } from 'vuex'

export default Vue.extend({
  name: 'mobile-structure-folder',
  props: {
    folder: Object,
    parents: Array,
    level: Number,
    isPopup: Boolean
  },
  computed: {
    path(): string[] {
      return designUtils.appendPath(this.parents as string[], this.folder as IFolder)
    },
    realFolders(): IFolder[] {
      return designUtils.sortById([...this.folder.subFolders])
    }
  },
  watch: {
    'folder.isExpanded': function(newVal) {
      if (newVal) {
        this.fetchCopiedStructuralFolders({ path: `${this.path.join(',')}` })
      }
    }
  },
  methods: {
    ...mapActions('design', {
      fetchCopiedStructuralFolders: 'fetchCopiedStructuralFolders'
    }),
    ...mapMutations('design', {
      setMoveToFolderSelectInfo: 'SET_moveToFolderSelectInfo',
      setCopiedExpand: 'SET_copiedExpand'
    }),
    expandIconStyles() {
      return this.folder.isExpanded ? { transform: 'rotate(90deg)' } : { transform: 'rotate(-90deg)' }
    },
    handleSelection() {
      this.setMoveToFolderSelectInfo(`f:${this.path.join('/')}`)
    },
    toggleExpansion() {
      this.setCopiedExpand({ path: this.path, isExpanded: !this.folder.isExpanded })
    },
    checkExpand(folders: IFolder[]): IFolder[] {
      if (this.folder.isExpanded) {
        return folders
      } else {
        return []
      }
    }
  }
})
</script>

<style lang="scss" scoped>
@function paddingForLevel($level) {
  @return 8px 16px 8px 24px * $level + 24px;
}

$maxLevels: 5;

@for $i from 0 through $maxLevels {
  .nav-folder-#{$i} {
    grid-template-columns: 24px auto 24px;
    padding: paddingForLevel($i);
    width: 100%;
    display: grid;
    grid-column-gap: 16px;
    align-items: center;
    box-sizing: border-box;
    transition: background-color 0.2s;
    height: 40px;
    cursor: pointer;
    &__text {
      height: 24px;
      display: flex;
      align-items: center;
      max-width: 30vw;
      > span {
        text-align: left;
        color: setColor(gray-2);
        font-weight: 400;
        font-size: 14px;
        line-height: 180%;
        display: block;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
    }
  }
}
.nav-folder__expand-icon-container {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
}
.nav-folder__expand-icon {
  transition: 0.1s linear
}
</style>
