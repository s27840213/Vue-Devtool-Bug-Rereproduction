<template lang="pug">
  section
    div(:class="[`nav-folder-${level}`, {'bg-blue-1': folder.isSelected}]"
        @click="handleSelection")
      div(class="nav-folder__expand-icon-container"
          @click.stop="toggleExpansion")
        svg-icon(class="nav-folder__expand-icon"
            iconName="chevron-down"
            iconColor="white"
            iconWidth="15px"
            :style="expandIconStyles()")
      svg-icon(iconName="folder"
          iconColor="white"
          iconWidth="20px")
      div(:class="`nav-folder-${level}__text`") {{ folder.name }}
    sidebar-folder(v-for="subFolder in checkExpand(folder.subFolders)" :folder="subFolder" :level="level+1" :parents="[...parents, folder.name]")
</template>
<script lang="ts">
import Vue from 'vue'
import { mapGetters, mapMutations } from 'vuex'
import { IFolder } from '@/interfaces/design'

export default Vue.extend({
  name: 'sidebar-folder',
  components: {
  },
  data() {
    return {
    }
  },
  props: {
    folder: Object,
    parents: Array,
    level: Number
  },
  computed: {
    ...mapGetters('design', {
      currentSelectedFolder: 'getCurrSelectedFolder'
    })
  },
  methods: {
    ...mapMutations('design', {
      setCurrentSelectedFolder: 'SET_currSelectedFolder',
      setExpand: 'SET_expand'
    }),
    expandIconStyles() {
      if (this.folder.isExpanded) {
        return {}
      } else {
        return {
          transform: 'rotate(-90deg)'
        }
      }
    },
    toggleExpansion() {
      // const pseudoSelectInfo = `f:${[...this.parents, this.folder.name].join('/')}`
      // if (this.currentSelectedFolder.startsWith(pseudoSelectInfo) && this.currentSelectedFolder !== pseudoSelectInfo) return
      this.setExpand({
        path: [...this.parents, this.folder.name],
        isExpanded: !this.folder.isExpanded
      })
    },
    checkExpand(folders: IFolder[]): IFolder[] {
      if (this.folder.isExpanded) {
        return folders
      } else {
        return []
      }
    },
    handleSelection() {
      this.setCurrentSelectedFolder(`f:${[...this.parents, this.folder.name].join('/')}`)
    }
  }
})
</script>

<style lang="scss" scoped>
@function paddingForLevel($level) {
  @return 10px 10px 10px 25px * $level + 18px;
}

@function fontWeightForLevel($level) {
  @if $level == 0 {
    @return 700;
  } @else {
    @return 400;
  }
}

$maxLevels: 5;

@for $i from 0 through $maxLevels {
  .nav-folder-#{$i} {
    grid-template-columns: 15px 20px auto;
    padding: paddingForLevel($i);
    width: 100%;
    display: grid;
    grid-column-gap: 10px;
    align-items: center;
    box-sizing: border-box;
    transition: background-color 0.2s;
    margin-bottom: 10px;
    cursor: pointer;
    &__text {
      font-family: 'NotoSansTC';
      text-align: left;
      color: white;
      font-size: 14px;
      font-weight: fontWeightForLevel($i);
      letter-spacing: 2.5px;
      white-space: nowrap;
    }
  }
}
.nav-folder__expand-icon-container {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 15px;
  height: 15px;
}
.nav-folder__expand-icon {
  transition: 0.1s linear
}
</style>
