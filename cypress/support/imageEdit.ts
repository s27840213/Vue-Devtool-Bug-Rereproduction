// Command that do image edit test
const adjustOptions = [{
  name: 'preset1',
  options: [
    { name: 'brightness', val: '26' },
    { name: 'contrast', val: '-36' },
    { name: 'saturate', val: '31' },
    { name: 'hue', val: '42' },
    { name: 'blur', val: '-38' },
    { name: 'halation', val: '38' },
    { name: 'warm', val: '32' },
  ]
}, {
  name: 'preset2',
  options: [
    { name: 'brightness', val: '-34' },
    { name: 'contrast', val: '44' },
    { name: 'saturate', val: '-40' },
    { name: 'hue', val: '-22' },
    { name: 'blur', val: '35' },
    { name: 'halation', val: '64' },
    { name: 'warm', val: '-6' },
  ]
}] as const

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
    .togglePanel('調整').then(() => {
      for (const adjustPreset of adjustOptions) {
        // Set adjust options as preset
        for (const option of adjustPreset.options) {
          cy.get(`input[type="range"][name="${option.name}"]`).eq(-1)
            .invoke('val', option.val).trigger('input')
        }
        cy.snapshotTest(`Adjust ${adjustPreset.name}`, { toggleMobilePanel: '調整' })
      }
    })
  // Restore image to original state
  cy.contains('重置效果').click()
    .togglePanel('調整')
  return cy.wrap(subject)
})

Cypress.Commands.add('imageCrop', { prevSubject: 'element' }, (subject, enterCrop: 'button' | 'dblclick') => {
  cy.wrap(subject).click()
    .then(() => {
      if (enterCrop === 'button') {
        cy.togglePanel('裁切')
      } else if (enterCrop === 'dblclick') {
        cy.wrap(subject).dblclick()
          .isMobile(() => {
            cy.get('.mobile-panel').waitTransition()
          })
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
    .isMobile(() => { cy.togglePanel('裁切') })
    .notMobile(() => { cy.togglePanel('取消') })
  return cy.get(subject.selector)
})

Cypress.Commands.add('imageShadow', { prevSubject: 'element' }, (subject) => {
  cy.wrap(subject).click()
    .togglePanel('陰影')
    .then(() => {
      for (const shadow of shadowsOptions) {
        cy.get(`.svg-photo-shadow-${shadow.name}, .svg-mobile-photo-shadow-${shadow.name}`).click()
          .get('.nu-layer .nu-layer__inProcess').should('not.exist')
        cy.contains('重置效果').click()
          // 30 = DRAWING_TIMEOUT in imageShadowUtils, debounce time of shadow setting
          .wait(30)
          .snapshotTest(`Shadow ${shadow.name} default`, { toggleMobilePanel: '陰影' })
        for (const option of shadow.options) {
          if (option.name === 'color') {
            cy.get('div.photo-effect-setting__value-input, .photo-shadow__color').click()
              .get('.color-panel').waitTransition()
              .get(`.color-btn .color-${option.val}`).eq(0).click()
              .get('.color-panel__btn, .mobile-panel__left-btn').click()
          } else {
            cy.get(`input[type="range"][name="${option.name}"]`).eq(-1)
              .invoke('val', option.val).trigger('input')
          }
        }
        cy.wait(30).snapshotTest(`Shadow ${shadow.name} preset`, { toggleMobilePanel: '陰影' })
      }
    })
    // Restore image to original state
    .get('.svg-photo-shadow-none, .svg-mobile-photo-shadow-none').click()
    .isMobile(() => { cy.togglePanel('陰影') })
  return cy.wrap(subject)
})

Cypress.Commands.add('imageSetAsBg', { prevSubject: 'element' }, (subject) => {
  const bgAdjustOptions = [
    { name: 'brightness', val: '80' },
    { name: 'contrast', val: '80' },
  ] as const

  cy.wrap(subject).click()
    .togglePanel('調整')
    .then(() => {
      for (const option of bgAdjustOptions) {
        cy.get(`input[type="range"][name="${option.name}"]`).eq(-1)
          .invoke('val', option.val).trigger('input')
      }
    })
    .isMobile(() => { cy.togglePanel('設為背景') })
    .notMobile(() => {
      cy.wrap(subject).rightclick()
        .get('.popup-layer').contains('設為背景').click()
    })
    .snapshotTest('Set as BG')
    // Restore image to original state
    .isMobile(() => { cy.togglePanel('分離背景') })
    .notMobile(() => {
      cy.get('.nu-background-image').rightclick()
        .get('.popup-page').contains('分離背景照片').click()
    })
    .get(subject.selector)
    .togglePanel('調整')
  cy.contains('重置效果').click()
    .togglePanel('調整')
  return cy.get(subject.selector)
})

Cypress.Commands.add('imageAutoBgRemove', { prevSubject: 'element' }, (subject) => {
  cy.wrap(subject).click()
    .togglePanel('去背')
    .get('.nu-layer .nu-layer__inProcess', { timeout: 20000 }).should('not.exist')
    .get('canvas.bg-remove-area').invoke('attr', 'cy-ready').should('eq', 'true')
    .togglePanel('完成')
  return cy.get(subject.selector)
})

Cypress.Commands.add('imageManuallyBgRemove', { prevSubject: 'element' }, (subject) => {
  cy.wrap(subject).click()
    .togglePanel('去背')
    .get('.nu-layer .nu-layer__inProcess', { timeout: 20000 }).should('not.exist')
    .get('canvas.bg-remove-area').invoke('attr', 'cy-ready').should('eq', 'true')
    .get('.panel-background-remove input[type="range"]')
    .invoke('val', 300).trigger('input')
    .get('canvas.bg-remove-area').realClick({ x: 300, y: 300 })
    .get('canvas.bg-remove-area').invoke('attr', 'cy-ready').should('eq', 'true')
    // .togglePanel('保留')
    // .get('canvas.bg-remove-area').realClick({ x: 300, y: 450 })
    // .get('canvas.bg-remove-area').invoke('attr', 'cy-ready').should('eq', 'true')
    .togglePanel('完成')
  return cy.wrap(subject)
})
