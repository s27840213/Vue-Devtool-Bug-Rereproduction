// Command that do layer edit test

Cypress.Commands.add('layerFlip', { prevSubject: 'element' }, (subject) => {
  cy.wrap(subject).click()
    .get('.panel-group .panel-group__adjust button').contains('翻轉').click()
    .get('.popup-flip .svg-flip-h').click()
    .snapshotTest('Flip h')
    .get('.popup-flip .svg-flip-v').click()
    .snapshotTest('Flip hv')
    .get('.popup-flip .svg-flip-h').click()
    .snapshotTest('Flip v')
    // Restore image to original state
    .get('.popup-flip .svg-flip-v').click()
  return cy.wrap(subject)
})

Cypress.Commands.add('layerAlign', { prevSubject: 'element' }, (subject) => {
  const alignOptions = [
    'left-align',
    'top-align',
    'center-horizontally',
    'right-align',
    'center-vertically',
    'bottom-align',
  ]

  cy.wrap(subject).click()
    .get('.panel-group .panel-group__adjust button').contains('位置對齊').click()
    .then(() => {
      for (const align of alignOptions) {
        cy.get(`.svg-${align}`).click()
          .snapshotTest(`Align ${align}`)
      }
    })
    // Restore layer to original state
    .get('.svg-center-horizontally').click()
    .get('.svg-center-vertically').click()
  return cy.wrap(subject)
})

Cypress.Commands.add('layerOrder', { prevSubject: 'element' }, (subjectFront, subjectBack) => {
  cy.wrap(subjectBack).click('topLeft')
    .get('.panel-group .svg-layers-alt').click()
    .get('.popup-order .svg-layers-forward').click()
    .snapshotTest('Oredr change')
    .get('.popup-order .svg-layers-backward').click()
    .snapshotTest('Oredr restore')
  return cy.wrap(subjectFront)
})

Cypress.Commands.add('layerCopy', { prevSubject: 'element' }, (subject) => {
  cy.wrap(subject).click()
    .get('.nu-page .nu-layer').then((oldLayers) => {
      // If use click() to trigger clipboard r/w, Chrome will throw 'Document is not focused.' error.
      // This will only happen when click 'Run All Test' button in cy spec sidebar and unfocus browser.
      // Use realClick() can prevent the error.
      cy.get('.panel-group .svg-copy').realClick()
        .get('.nu-page .nu-layer').should('have.length', oldLayers.length + 1)
        .snapshotTest('Copy layer').then((newLayers) => {
          const newLayer = newLayers.not(oldLayers)
          cy.wrap(newLayer).click().type('{del}')
        })
    })
  return cy.wrap(subject)
})

Cypress.Commands.add('layerLock', { prevSubject: 'element' }, (subject) => {
  cy.wrap(subject).click()
    .realMouseDown()
    .realMouseMove(30, 30, { position: 'center' })
    .realMouseUp()
    .snapshotTest('Lock unlocked')
    .get('.panel-group .svg-lock').click()
    .wrap(subject)
    .realMouseDown()
    .realMouseMove(-30, -30, { position: 'center' })
    .realMouseUp()
    .snapshotTest('Lock locked')
    .get('.panel-group .svg-unlock').click()
    .wrap(subject)
    .realMouseDown()
    .realMouseMove(-30, -30, { position: 'center' })
    .realMouseUp()
  return cy.wrap(subject)
})

Cypress.Commands.add('layerDelete', { prevSubject: 'element' }, (subject) => {
  cy.wrap(subject).click()
    .get('.nu-page .nu-layer').then((oldLayers) => {
      cy.get('body').realPress(['Meta', 'c']).realPress(['Meta', 'v'])
        .get('.nu-page .nu-layer').should('have.length', oldLayers.length + 1)
        .snapshotTest('Delete before')
        .get('.panel-group .svg-trash').realClick()
        .snapshotTest('Delete after')
    })
  return cy.wrap(subject)
})

Cypress.Commands.add('layerCopyFormat', { prevSubject: 'element' }, (subject) => {
  cy.wrap(subject).click()
  return cy.wrap(subject)
})

Cypress.Commands.add('layerRotate', { prevSubject: 'element' }, (subject) => {
  cy.wrap(subject).click()
  return cy.wrap(subject)
})

Cypress.Commands.add('layerScale', { prevSubject: 'element' }, (subject) => {
  cy.wrap(subject).click()
  return cy.wrap(subject)
})
