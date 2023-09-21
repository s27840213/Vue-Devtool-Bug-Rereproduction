import SvgIcon from './SvgIcon.vue'

export default {
  title: 'SvgIcon',
  component: SvgIcon,
  tags: ['autodocs'],
  // 👇 Our events will be mapped in Storybook UI
}

const baseArgs = {
  iconName: 'erase',
  iconColor: 'app-selection',
  iconWidth: '24px',
  iconHeight: '24px',
  // only used for those who alread has stroke
  strokeColor: 'bg-app-btn-primary-bg',
  sameSize: true,
}
export const Test = {
  args: { ...baseArgs },
}

// export const IconList = (args) => ({
//   components: { FSvgIcon },
//   setup() {
//     const icons = import.meta.globEager('./icons/**/*.svg')
//     const iconNameList = []
//     for (const path in icons) {
//       const startIndex = path.match(/\w*\.svg/).index
//       const endIndex = path.length - 4
//       iconNameList.push(path.slice(startIndex, endIndex))
//     }
//     return {
//       iconNameList,
//     }
//   },
//   template: `
//     <div>
//       <p class="font-bold text-red-400">The controls panel is not working in the page</p>
//       <div v-for="iconName in iconNameList" class="flex">
//         <f-svg-icon size="20" :iconName="iconName" />
//         <p class="pl-2">{{ iconName }}</p>
//       </div>
//     </div>
// `,
// })
