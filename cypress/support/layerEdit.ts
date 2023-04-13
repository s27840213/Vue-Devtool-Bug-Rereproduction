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
      cy.get('.header-bar, .function-panel').find('.svg-copy').click()
        .get('.nu-page .nu-layer').should('have.length', oldLayers.length + 1)
        .snapshotTest('Copy layer')
        // Restore layer to original state
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
    .snapshotTest('Lock unlocked') // Usually need to retry snapshot
    .get('.svg-unlock').click()
    .wait(500)
    .wrap(subject)
    .realMouseDown()
    .realMouseMove(-30, -30, { position: 'center' })
    .realMouseUp()
    .snapshotTest('Lock locked')
    // Restore layer to original state
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
      // If use type() to trigger clipboard r/w, Chrome will throw 'Document is not focused.' error.
      // This will only happen when click 'Run All Test' button in cy spec sidebar and unfocus browser.
      // Use realPress() can prevent the error.
      cy.get('body').realPress(['Meta', 'c']).realPress(['Meta', 'v'])
        .get('.nu-page .nu-layer').should('have.length', oldLayers.length + 1)
        .snapshotTest('Delete before')
        .get('.svg-trash').click()
        .wait(5000)
        .snapshotTest('Delete after')
    })
  return cy.wrap(subject)
})

Cypress.Commands.add('layerCopyFormat', { prevSubject: 'element' }, (subjectFront, subjectBack, before, after) => {
  // cy.wrap(subjectBack).click('topLeft')
  //   .then(before)
  //   .then(after)
  cy.wrap(subjectFront).click()
    .then(before)
    .snapshotTest('Copy format before')
    .get('.panel-group, .footer-tabs').find('.svg-brush').click({ force: true })
    .wrap(subjectBack).click('topLeft')
    .snapshotTest('Copy format after')
    // Restore layer to original state
    // .then(after)
    // .get('.panel-group, .footer-tabs').find('.svg-brush').click({ force: true })
    // .wrap(subjectFront).click('topLeft')
    .get('.svg-undo').click()
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

// Special text for some layer

Cypress.Commands.add('layerRotateAndResize', { prevSubject: 'element' }, (subject) => {
  const resizeDir = [
    { i: 0, x: -1, y: -1 },
    { i: 1, x: 1, y: 1 },
    { i: 2, x: -1, y: 1 },
    { i: 3, x: 1, y: -1 },
  ]

  cy.wrap(subject).click()
    .get('.svg-rotate')
    .realMouseDown()
    .realMouseMove(-158, -158, { position: 'center' }) // Rotate 60 degrees, counter-clockwise
    .realMouseUp()
    .snapshotTest('RotateAndResize before resize')
    .then(() => {
      for (const { i, x, y } of resizeDir) {
        cy.get('.control-point__resize-bar-wrapper').eq(i).children().eq(1)
          .realMouseDown()
          .realMouseMove(x * 30, y * 30, { position: 'center' })
          .realMouseUp()
      }
    })
    .snapshotTest('RotateAndResize after resize')
    // Restore layer to original state
    .get('.svg-undo').click().click()
  return cy.wrap(subject)
})

Cypress.Commands.add('layerMultipleCopyAndMove', { prevSubject: 'element' }, (subject, method, isMobile) => {
  if (isMobile && ['shortcut', 'rightclick'].includes(method)) return cy.wrap(subject)
  const moveDir = [
    { i: 0, x: 1, y: 0 },
    { i: 1, x: 1, y: -1 },
    { i: 2, x: 1, y: 1 },
    { i: 3, x: -1, y: 1 },
    { i: 4, x: -1, y: -1 },
  ]
  const moveDistance = isMobile ? 150 : 200
  cy.wrap(subject).click()
    .get('.nu-page .nu-layer').then((oldLayers) => {
      switch (method) {
        case 'functionalPanel':
          cy.get('.header-bar, .function-panel')
            .find('.svg-copy').click().click().click().click().click()
          break
        case 'shortcut':
          cy.realPress(['Meta', 'c']).realPress(['Meta', 'v'])
            .realPress(['Meta', 'v']).realPress(['Meta', 'v'])
            .realPress(['Meta', 'v']).realPress(['Meta', 'v'])
          break
        case 'rightclick':
          cy.wrap(subject).rightclick()
            .get('.popup').contains('複製').realClick().then(() => {
              for (let i = 0; i < 5; i++) {
                cy.wrap(subject).realClick({ button: 'right' })
                  .get('.popup .svg-paste').realClick()
                  .get('.nu-page .nu-layer').should('have.length', oldLayers.length + i + 1)
              }
            })
          break
      }
      cy.get('.nu-page .nu-layer').should('have.length', oldLayers.length + 5)
        .get('.nu-page .nu-layer').then((layers) => {
          const newLayers = layers.not(oldLayers).toArray().reverse()
          cy.isMobile(() => { cy.deselectAllLayers() }) // Prevent img clip mode
          for (const { i, x, y } of moveDir) {
            cy.wrap(newLayers[i]).click({ force: true })
              .wrap(newLayers[i])
              .realMouseDown()
              .realMouseMove(x * moveDistance, y * moveDistance, { position: 'center' })
              .realMouseUp({ scrollBehavior: false })
              .isMobile(() => { cy.wait(100) }) // Wait page card go back to original position
          }
          cy.snapshotTest('MultipleCopyAndMove')
          // Restore layer to original state
          for (const layer of newLayers) {
            cy.wrap(layer).click().type('{del}')
          }
        })
        .get('.nu-page .nu-layer').should('have.length', oldLayers.length)
    })
  return cy.wrap(subject)
})

Cypress.Commands.add('layerMoveToPage2', { prevSubject: 'element' }, (subject, isMobile) => {
  if (isMobile) return cy.wrap(subject)
  cy.wrap(subject).click()
    .get('.svg-add-page').click()
    .wrap(subject)
    .realMouseDown()
    .realMouseMove(100, 600, { position: 'center' })
    .realMouseUp()
    .get('.editor-view').scrollTo(0, 0, { ensureScrollable: false })
    .snapshotTest('Move to page 2 - p1')
    .scrollTo(0, 9999, { ensureScrollable: false })
    .snapshotTest('Move to page 2 - p2', { pageIndex: 1 })
    // Restore layer to original state
    .scrollTo(0, 300, { ensureScrollable: false })
    .get('#nu-page_1 .nu-image').click({ scrollBehavior: false })
    .realMouseDown({ scrollBehavior: false })
    .realMouseMove(-100, -600, { position: 'center', scrollBehavior: false })
    .realMouseUp()
    .get('.nu-page-content-1 > .layers-wrapper').children().should('have.length', 0)
    .get('.page-title .svg-trash').eq(-1).click()
    .get('.editor-view__canvas').children().should('have.length', 2)
  return cy.wrap(subject)
})
