/* eslint-disable import/prefer-default-export */
const iconAlign = ['left-align', 'distribute-horizontally', 'right-align', 'top-align', 'center-vertically', 'distribute-vertically', 'distribute-horizontally']
const iconAction = ['layers-alt', 'copy', 'unlock', 'trash']
const iconOrder = ['layers-front', 'layers-forward', 'layers-backward', 'layers-back']
const iconFont = ['bold', 'underline', 'italic', 'font-vertical']
const iconFontAlign = ['text-align-left', 'text-align-center', 'text-align-right', 'text-align-justify']

function mappingIconSet(set: string): string[] {
  switch (set) {
    case 'align':
      return iconAlign
    case 'action':
      return iconAction
    case 'order':
      return iconOrder
    case 'font':
      return iconFont
    case 'font-align':
      return iconFontAlign
    default:
      return []
  }
}

export { mappingIconSet }
