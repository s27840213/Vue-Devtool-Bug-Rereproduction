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
    { name: 'distance', val: '65' },
    { name: 'angle', val: '23' },
    { name: 'radius', val: '69' },
    { name: 'spread', val: '6' },
    { name: 'opacity', val: '48' },
    { name: 'color', val: 'EB5757' },
  ]
}, {
  name: 'blur',
  options: [
    { name: 'radius', val: '70' },
    { name: 'spread', val: '18' },
    { name: 'opacity', val: '75' },
    { name: 'color', val: 'FECD56' },
  ]
}, {
  name: 'imageMatched',
  options: [
    { name: 'distance', val: '83' },
    { name: 'angle', val: '55' },
    { name: 'radius', val: '19' },
    { name: 'size', val: '96' },
    { name: 'opacity', val: '49' },
  ]
}, {
  name: 'frame',
  options: [
    { name: 'radius', val: '63' },
    { name: 'spread', val: '14' },
    { name: 'opacity', val: '47' },
    { name: 'color', val: '007ABE' },
  ]
}, {
  name: 'floating',
  options: [
    { name: 'x', val: '61' },
    { name: 'y', val: '60' },
    { name: 'radius', val: '81' },
    { name: 'size', val: '63' },
    { name: 'thinkness', val: '61' },
    { name: 'opacity', val: '36' },
    { name: 'color', val: '782B76' },
  ]
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
          .get('.photo-effect-setting__reset').click()
          // 30 = DRAWING_TIMEOUT in imageShadowUtils, debounce time of shadow setting
          .wait(30).snapshotTest(`Shadow ${shadow.name} default`)
        for (const option of shadow.options) {
          if (option.name === 'color') {
            cy.pause().get('.photo-effect-setting div.photo-effect-setting__value-input')
              .click()
              .get(`.color-btn .color-${option.val}`).eq(0).click()
              .get('.color-panel__btn').click()
          } else {
            cy.get(`.photo-effect-setting input[type="range"][name="${option.name}"]`)
              .invoke('val', option.val).trigger('input')
          }
        }
        cy.wait(30).snapshotTest(`Shadow ${shadow.name} preset`)
      }
    })
    .get('.svg-photo-shadow-none').click()
  return cy.wrap(subject)
})

Cypress.Commands.add('imageSetBg', { prevSubject: 'element' }, (subject) => {
  return cy.wrap(subject)
})
