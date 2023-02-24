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
  'dragElementTo',
  {
    prevSubject: true
  },
  (subject, targetAfterDrag, targetAfterDrop = undefined) => {
    cy.wrap(subject).trigger('dragstart')
      .trigger('drag')
      .trigger('dragleave')
    targetAfterDrag().trigger('dragenter')
      .trigger('dragover')
      .trigger('drop')
    if (!targetAfterDrop) return
    targetAfterDrop().trigger('dragend')
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
  (subject, option = {}) => {
    cy.wrap(subject)
      .trigger('mousedown', { shiftKey: true, ...option })
  }
)

Cypress.Commands.add(
  'selectFormat',
  (width, height) => {
    cy.get('.page-setting__apply__text').click()
    cy.get('.page-setting__suggestion-panel__body__custom svg')
      .click()
    cy.get('.page-setting__suggestion-panel__body__custom__box')
      .eq(0)
      .find('input')
      .type(`{selectall}{backspace}${width}`)
    cy.get('.page-setting__suggestion-panel__body__custom__box')
      .eq(1)
      .find('input')
      .type(`{selectall}{backspace}${height}`)
    cy.get('.page-setting__suggestion-panel__body__button')
      .contains(/^調整尺寸$/)
      .click()
  }
)

Cypress.Commands.add(
  'delete',
  {
    prevSubject: true
  },
  (subject) => {
    cy.wrap(subject)
      .type('{del}')
  }
)
