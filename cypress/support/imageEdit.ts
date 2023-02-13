// Command that do image edit test

Cypress.Commands.add('imageAdjust', { prevSubject: 'element' }, (subject) => {
  function getOptions() {
    const options = [
      ['brightness', '50', '0'],
      ['brightness', '-50', '0'],
      ['contrast', '50', '0'],
      ['contrast', '-50', '0'],
      ['saturate', '50', '0'],
      ['saturate', '-50', '0'],
      ['hue', '50', '0'],
      ['hue', '-50', '0'],
      ['blur', '50', '0'],
      ['blur', '-50', '0'],
      ['halation', '75', '0'],
      ['halation', '25', '0'],
      ['warm', '50', '0'],
      ['warm', '-50', '0']
    ]
    return options.map(option => {
      return { name: option[0], val: option[1], init: option[2] }
    })
  }

  cy.wrap(subject).click()
    .get('.photo-setting .photo-setting__grid button').contains('調整').click()
    .then(() => {
      for (const option of getOptions()) {
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
  return cy.wrap(subject)
})

Cypress.Commands.add('imageSetBg', { prevSubject: 'element' }, (subject) => {
  return cy.wrap(subject)
})
