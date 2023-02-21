// Command that do layer edit test

Cypress.Commands.add('layerFlip', { prevSubject: 'element' }, (subject) => {
  cy.wrap(subject).click()
    .togglePanel('翻轉')
    .get('.svg-flip-h').click()
    .snapshotTest('Flip h')
    .get('.svg-flip-v').click()
    .snapshotTest('Flip hv')
    .get('.svg-flip-h').click()
    .snapshotTest('Flip v')
    // Restore image to original state
    .get('.svg-flip-v').click()
    .togglePanel('翻轉')
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
    .togglePanel('對齊')
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
    .get('.svg-layers-alt').realClick()
    .isMobile(() => { cy.get('.mobile-panel').waitTransition() })
    .get('.svg-layers-forward').click()
    .snapshotTest('Oredr change')
    .get('.svg-layers-backward').click()
    .snapshotTest('Oredr restore')
    // Restore layer to original state (close panel)
    .get('.svg-layers-alt').realClick()
  return cy.wrap(subjectFront)
})

Cypress.Commands.add('layerCopy', { prevSubject: 'element' }, (subject) => {
  cy.wrap(subject).click()
    .get('.nu-page .nu-layer').then((oldLayers) => {
      // If use click() to trigger clipboard r/w, Chrome will throw 'Document is not focused.' error.
      // This will only happen when click 'Run All Test' button in cy spec sidebar and unfocus browser.
      // Use realClick() can prevent the error.
      cy.get('.svg-copy').click()
        .get('.nu-page .nu-layer').should('have.length', oldLayers.length + 1)
        .snapshotTest('Copy layer')
        .get('body').type('{del}')
        .get('.nu-page .nu-layer').should('have.length', oldLayers.length)
    })
  return cy.wrap(subject)
})

Cypress.Commands.add('layerLock', { prevSubject: 'element' }, (subject) => {
  cy.wrap(subject).click()
    .realMouseDown()
    .realMouseMove(30, 30, { position: 'center' })
    .realMouseUp()
    .snapshotTest('Lock unlocked')
    .get('.svg-unlock').click()
    .wrap(subject)
    .realMouseDown()
    .realMouseMove(-30, -30, { position: 'center' })
    .realMouseUp()
    .snapshotTest('Lock locked')
    .get('.panel-group, .header-bar').find('.svg-lock').click()
    .wrap(subject)
    .realMouseDown()
    .realMouseMove(-30, -30, { position: 'center' })
    .realMouseUp()
  return cy.wrap(subject)
})

Cypress.Commands.add('layerDelete', { prevSubject: 'element' }, (subject) => {
  cy.wait(500) // Prevent click trigger double click, TODO: Fix it in app
    .wrap(subject).click()
    .get('.nu-page .nu-layer').then((oldLayers) => {
      cy.get('body').realPress(['Meta', 'c']).realPress(['Meta', 'v'])
        .get('.nu-page .nu-layer').should('have.length', oldLayers.length + 1)
        .snapshotTest('Delete before')
        .get('.svg-trash').click()
        .snapshotTest('Delete after')
    })
  return cy.wrap(subject)
})

Cypress.Commands.add('layerCopyFormat', { prevSubject: 'element' }, (subjectFront, subjectBack, before, after) => {
  cy.wrap(subjectFront).click()
    .then(before)
    .snapshotTest('Copy format before')
    .get('.panel-group .svg-brush').click()
    .wrap(subjectBack).click('topLeft')
    .snapshotTest('Copy format after')
    .then(after)
    .get('.panel-group .svg-brush').click()
    .wrap(subjectFront).click('topLeft')
  return cy.wrap(subjectFront)
})

Cypress.Commands.add('layerRotate', { prevSubject: 'element' }, (subject) => {
  cy.wrap(subject).click()
  return cy.wrap(subject)
})

Cypress.Commands.add('layerScale', { prevSubject: 'element' }, (subject) => {
  cy.wrap(subject).click()
  return cy.wrap(subject)
})
