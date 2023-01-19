describe('Testing login', () => {
  it('login from email', () => {
    cy.login()
    cy.visit('')
    cy.get('.avatar').should('exist')
  })
})
