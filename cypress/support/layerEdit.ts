Cypress.Commands.add('layerFlip', { prevSubject: 'element' }, (subject) => {
  cy.wrap(subject).click()
    .get('.panel-group .panel-group__adjust button').contains('翻轉').click()
    .then(() => {
      cy.get('.popup-flip .svg-flip-h').click()
        .snapshotTest('Flip h')
        .get('.popup-flip .svg-flip-v').click()
        .snapshotTest('Flip hv')
        .get('.popup-flip .svg-flip-h').click()
        .snapshotTest('Flip v')
        .get('.popup-flip .svg-flip-v').click()
    })
  return cy.wrap(subject)
})

Cypress.Commands.add('layerAlign', { prevSubject: 'element' }, (subject) => {
  return cy.wrap(subject)
})
