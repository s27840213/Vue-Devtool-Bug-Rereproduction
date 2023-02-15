// Command that do image edit test
const adjustOptions = [
  { name: 'brightness', val: '50' },
  { name: 'brightness', val: '-50' },
  { name: 'contrast', val: '50' },
  { name: 'contrast', val: '-50' },
  { name: 'saturate', val: '50' },
  { name: 'saturate', val: '-50' },
  { name: 'hue', val: '50' },
  { name: 'hue', val: '-50' },
  { name: 'blur', val: '50' },
  { name: 'blur', val: '-50' },
  { name: 'halation', val: '75' },
  { name: 'halation', val: '25' },
  { name: 'warm', val: '50' },
  { name: 'warm', val: '-50' }
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
          .invoke('val', option.val).trigger('input')
          .snapshotTest(`Adjust ${option.name} ${option.val}`)
          .get('.popup-adjust__reset').click()
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
    .snapshotTest('Crop init')
    .get('.dim-background .nu-controller__body .controller-point').eq(1)
    .realMouseDown()
    .realMouseMove(30, -30)
    .realMouseUp()
    .snapshotTest('Crop scale top right').then(() => {
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
          .snapshotTest(`Crop move ${move.name}`)
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
    .snapshotTest('Crop init')
    .get('.panel-group .panel-group__adjust button').contains('取消').click()
  return cy.get(subject.selector)
})

Cypress.Commands.add('imageShadow', { prevSubject: 'element' }, (subject) => {
  cy.wrap(subject).click()
    .get('.photo-setting__grid button').contains('陰影').click()
    .then(() => {
      for (const shadow of shadowsOptions) {
        cy.get(`.svg-photo-shadow-${shadow.name}`).click()
          .get('.nu-layer .nu-layer__inProcess').should('not.exist')
          .get('.photo-effect-setting__reset').click({ scrollBehavior: 'top' })
          // 30 = DRAWING_TIMEOUT in imageShadowUtils, debounce time of shadow setting
          .wait(30).snapshotTest(`Shadow ${shadow.name} default`)
        for (const option of shadow.options) {
          if (option.name === 'color') {
            cy.get('.photo-effect-setting div.photo-effect-setting__value-input')
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
    // Restore image to original state
    .get('.svg-photo-shadow-none').click()
  return cy.wrap(subject)
})

Cypress.Commands.add('imageSetAsBg', { prevSubject: 'element' }, (subject) => {
  const bgAdjustOptions = [
    { name: 'brightness', val: '80' },
    { name: 'contrast', val: '80' },
  ] as const

  cy.wrap(subject).click()
    .get('.photo-setting .photo-setting__grid button').contains('調整').click()
    .then(() => {
      for (const option of bgAdjustOptions) {
        cy.get(`.photo-setting .popup-adjust input[type="range"][name="${option.name}"]`)
          .invoke('val', option.val).trigger('input')
      }
    })
    .wrap(subject).rightclick()
    .get('.popup-layer').contains('設為背景').click()
    .snapshotTest('Set as BG')
    // Restore image to original state
    .get('.nu-background-image').rightclick()
    .get('.popup-page').contains('分離背景照片').click()
    .get('.photo-setting .photo-setting__grid button').contains('調整').click()
    .get('.popup-adjust__reset').click()
  return cy.get(subject.selector)
})

Cypress.Commands.add('imageAutoBgRemove', { prevSubject: 'element' }, (subject) => {
  cy.wrap(subject).click()
    .get('.photo-setting .photo-setting__grid button').contains('去背').click()
    .get('.nu-layer .nu-layer__inProcess').should('not.exist')
  return cy.wrap(subject)
})

Cypress.Commands.add('imageManuallyBgRemove', { prevSubject: 'element' }, (subject) => {
  //
  return cy.wrap(subject)
})
