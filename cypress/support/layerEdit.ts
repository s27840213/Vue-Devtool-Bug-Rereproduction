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
