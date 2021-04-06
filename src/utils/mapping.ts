/* eslint-disable import/prefer-default-export */
const iconAlign = ['left-align', 'distribute-horizontally', 'right-align', 'top-align', 'center-vertically']
const iconGroupAction = ['layer-alt', 'copy', 'unlock', 'trash']
const iconOrder = ['layers-front', 'layers-forward', 'layers-backward', 'layers-back']

function mappingIconSet(set: string): string[] {
  switch (set) {
    case 'align':
      return iconAlign
    case 'group-action':
      return iconGroupAction
    case 'order':
      return iconOrder
    default:
      return []
  }
}

export { mappingIconSet }
