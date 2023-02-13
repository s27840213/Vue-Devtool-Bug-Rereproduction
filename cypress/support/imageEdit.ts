// Command that do image edit test
const adjustOptions = [
  { name: 'brightness', val: '50', init: '0' },
  { name: 'brightness', val: '-50', init: '0' },
  { name: 'contrast', val: '50', init: '0' },
  { name: 'contrast', val: '-50', init: '0' },
  { name: 'saturate', val: '50', init: '0' },
  { name: 'saturate', val: '-50', init: '0' },
  { name: 'hue', val: '50', init: '0' },
  { name: 'hue', val: '-50', init: '0' },
  { name: 'blur', val: '50', init: '0' },
  { name: 'blur', val: '-50', init: '0' },
  { name: 'halation', val: '75', init: '0' },
  { name: 'halation', val: '25', init: '0' },
  { name: 'warm', val: '50', init: '0' },
  { name: 'warm', val: '-50', init: '0' }
] as const

const shadowsOptions = [{
  name: 'shadow',
  options: [
    { name: 'distance', val: '75', init: '50' },
    { name: 'distance', val: '25', init: '50' },
    { name: 'angle', val: '90', init: '20' },
    { name: 'angle', val: '-90', init: '20' },
    { name: 'radius', val: '75', init: '50' },
    { name: 'radius', val: '25', init: '50' },
    { name: 'spread', val: '15', init: '0' },
    { name: 'spread', val: '5', init: '0' },
    { name: 'opacity', val: '75', init: '40' },
    { name: 'opacity', val: '25', init: '40' },
    { name: 'color', val: 'FECD56', init: '000000' },
    { name: 'color', val: 'EB5757', init: '000000' },
  ]
}, {
  name: 'blur',
  options: [
    { name: 'radius', val: '75', init: '50' },
    { name: 'radius', val: '25', init: '50' },
    { name: 'spread', val: '23', init: '10' },
    { name: 'spread', val: '8', init: '10' },
    { name: 'opacity', val: '75', init: '40' },
    { name: 'opacity', val: '25', init: '40' },
    { name: 'color', val: 'FECD56', init: '000000' },
    { name: 'color', val: 'EB5757', init: '000000' },
  ]
}, {
  name: 'imageMatched',
  options: [
    { name: 'distance', val: '75', init: '60' },
    { name: 'distance', val: '25', init: '60' },
    { name: 'angle', val: '90', init: '40' },
    { name: 'angle', val: '-90', init: '40' },
    { name: 'radius', val: '75', init: '50' },
    { name: 'radius', val: '25', init: '50' },
    { name: 'size', val: '90', init: '100' },
    { name: 'size', val: '80', init: '100' },
    { name: 'opacity', val: '75', init: '60' },
    { name: 'opacity', val: '25', init: '60' },
  ]
}, {
  name: 'frame',
  options: [
    { name: 'radius', val: '75', init: '0' },
    { name: 'radius', val: '25', init: '0' },
    { name: 'spread', val: '23', init: '20' },
    { name: 'spread', val: '8', init: '20' },
    { name: 'opacity', val: '75', init: '100' },
    { name: 'opacity', val: '25', init: '100' },
    { name: 'color', val: 'FECD56', init: '000000' },
    { name: 'color', val: 'EB5757', init: '000000' },
  ]
}, {
  name: 'floating',
  options: [
    { name: 'x', val: '50', init: '0' },
    { name: 'x', val: '-50', init: '0' },
    { name: 'y', val: '50', init: '0' },
    { name: 'y', val: '-50', init: '0' },
    { name: 'radius', val: '75', init: '60' },
    { name: 'radius', val: '25', init: '60' },
    { name: 'size', val: '89', init: '100' },
    { name: 'size', val: '46', init: '100' },
    { name: 'thinkness', val: '75', init: '50' },
    { name: 'thinkness', val: '25', init: '50' },
    { name: 'opacity', val: '75', init: '65' },
    { name: 'opacity', val: '25', init: '65' },
  ]
}, {
  name: 'none',
  options: []
}] as const

Cypress.Commands.add('imageAdjust', { prevSubject: 'element' }, (subject) => {
  cy.wrap(subject).click()
    .get('.photo-setting .photo-setting__grid button').contains('調整').click()
    .then(() => {
      for (const option of adjustOptions) {
        cy.get(`.photo-setting .popup-adjust input[type="range"][name="${option.name}"]`)
          .invoke('val', option.val).trigger('input').snapshotTest(`Adjust ${option.name} ${option.val}`)
          .get(`.photo-setting .popup-adjust input[type="range"][name="${option.name}"]`)
          .invoke('val', option.init).trigger('input')
      }
    })
  return cy.wrap(subject)
})

Cypress.Commands.add('imageCrop', { prevSubject: 'element' }, (subject, enterCrop: 'button'|'dblclick') => {
  cy.wrap(subject).click()
    .then(() => {
      if (enterCrop === 'button') {
        cy.get('.photo-setting .photo-setting__grid button').contains('裁切').click()
      } else if (enterCrop === 'dblclick') {
        cy.wrap(subject).dblclick()
      } else {
        throw new Error(`Unexpected enterCrop value: '${enterCrop}' in imageCrop command`)
      }
    })
    .snapshotTest('Image crop, init')
    .get('.dim-background .nu-controller__body .controller-point').eq(1)
    .realMouseDown()
    .realMouseMove(30, -30)
    .realMouseUp()
    .snapshotTest('Image crop, scale top right').then(() => {
      const moves = [
        { name: 'left', x: -30, y: 0 },
        { name: 'down', x: 0, y: 30 },
        { name: 'right', x: 30, y: 0 }
      ]
      for (const move of moves) {
        cy.get('.nu-controller__body')
          .realMouseDown()
          .realMouseMove(move.x, move.y, { position: 'center' })
          .realMouseUp()
          .snapshotTest(`Image crop, move ${move.name}`)
      }
    })
    // Restore image to original state
    .get('.nu-controller__body')
    .realMouseDown()
    .realMouseMove(100, -100, { position: 'center' })
    .realMouseUp()
    .get('.dim-background .nu-controller__body .controller-point').eq(1)
    .realMouseDown()
    .realMouseMove(-100, 100)
    .realMouseUp()
    .snapshotTest('Image crop, init')
    .get('.panel-group .panel-group__adjust button').contains('取消').click()
  return cy.get(subject.selector)
})

Cypress.Commands.add('imageShadow', { prevSubject: 'element' }, (subject) => {
  cy.wrap(subject).click()
    .get('.photo-setting__grid button').contains('陰影').click()
    .then(() => {
      for (const shadow of shadowsOptions) {
        cy.get(`.svg-photo-shadow-${shadow.name}`).click()
        cy.get('.nu-layer .nu-layer__inProcess').should('not.exist')
          .snapshotTest(`Shadow ${shadow.name} init`)
        for (const option of shadow.options) {
          if (option.name === 'color') {
            cy.get('.photo-effect-setting div.photo-effect-setting__value-input')
              .click()
              .get(`.color-btn .color-${option.val}`).eq(0).click()
              .wait(30).snapshotTest(`Shadow ${shadow.name} ${option.name} ${option.val}`)
              .get(`.color-btn .color-${option.init}`).eq(0).click()
              .get('.color-panel__btn').click()
          } else {
            cy.get(`.photo-effect-setting input[type="range"][name="${option.name}"]`)
              .invoke('val', option.val).trigger('input').wait(30).snapshotTest(`Shadow ${shadow.name} ${option.name} ${option.val}`)
              .get(`.photo-effect-setting input[type="range"][name="${option.name}"]`)
              .invoke('val', option.init).trigger('input')
          }
        }
      }
    })
  return cy.wrap(subject)
})

Cypress.Commands.add('imageSetBg', { prevSubject: 'element' }, (subject) => {
  return cy.wrap(subject)
})
