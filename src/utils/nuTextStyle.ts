import { Extension } from '@tiptap/core'

export default Extension.create({
  name: 'nuTextStyle',
  addGlobalAttributes() {
    return [
      {
        types: ['textStyle'],
        attributes: {
          style: {
            default: null,
            parseHTML: element => {
              return element.style.cssText
            },
            renderHTML: attributes => {
              if (!attributes.style) return {}
              return {
                style: attributes.style
              }
            }
          }
        }
      }
    ]
  }
})
