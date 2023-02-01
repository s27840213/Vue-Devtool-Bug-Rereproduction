import loginData from '../fixtures/loginData.json'

describe('Testing login', () => {
  it('Login from POST request', () => {
    cy.login()
    cy.visit('/')
    cy.get('.avatar').should('exist')
  })

  it('Login from email', () => {
    cy.visit('/login')
    cy.get('input[type="email"]').type(loginData.email.account)
    cy.get('input[type="password"]').type(loginData.email.password)
    cy.get('button').contains('登 入').click()
    cy.get('.avatar').should('exist')
  })
})
