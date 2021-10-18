Cypress.Commands.add(
  'dragTo',
  {
    prevSubject: true
  },
  (subject, offsetx, offsety, option = {}) => {
    cy.wrap(subject)
      .then($el => {
        const rect = $el[0].getBoundingClientRect()
        const midx = rect.x + rect.width / 2
        const midy = rect.y + rect.height / 2
        cy.log('el position: ', midx, midy)
        cy.wrap($el)
          .trigger('mousedown', option)

        cy.get('body')
          .trigger('mousemove', {
            clientX: midx,
            clientY: midy,
            force: true
          })
          .trigger('mousemove', {
            clientX: midx + offsetx,
            clientY: midy + offsety,
            force: true
          })
          .trigger('mouseup', { force: true })
      })
  }
)

Cypress.Commands.add(
  'selectAll',
  (pageIndex = 0) => {
    cy.get('.pages-wrapper')
      .eq(pageIndex)
      .click(0, 0)
      .type('{meta}a')
  }
)

Cypress.Commands.add(
  'deselectAll',
  (pageIndex = 0) => {
    cy.get('.pages-wrapper')
      .eq(pageIndex)
      .click(0, 0)
      .type('{meta}d')
  }
)

Cypress.Commands.add(
  'select',
  {
    prevSubject: true
  },
  (subject) => {
    cy.wrap(subject)
      .trigger('mousedown', { shiftKey: true })
  }
)
