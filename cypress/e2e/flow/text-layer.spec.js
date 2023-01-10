const sizes = [
  { width: 900, height: 900 }
]

describe('Text Layer Control:', () => {
  it('visit page', () => {
    cy.visit('http://localhost:8080/editor')
  })

  sizes.forEach(size => {
    const btnText = `${size.width}x${size.height} px`
    describe(`format ${btnText}`, () => {
      it('add new design', () => {
        cy.get('.btn-file')
          .click()
        cy.get('.popup-file__item')
          .contains('建立新設計')
          .click()
      })

      it(`select page format ${btnText}`, () => {
        cy.selectFormat(size.width, size.height)
        cy.get('.page-content')
          .first()
          .should('have.attr', 'style')
          .and('match', RegExp(`width: ${size.width}px`))
          .and('match', RegExp(`height: ${size.height}px`))
      })

      it('add heading', () => {
        cy.get('.btn-text-heading').click()
        cy.wait(500)
        cy.get('.text__body')
          .type('{selectall}{backspace}我最愛Vivipic2')
      })

      it('add subheading', () => {
        cy.get('.btn-text-subheading').click()
        cy.wait(500)
        cy.get('.text__body')
          .type('{selectall}{backspace}我最愛Vivipic3')
      })

      it('text grouping', () => {
        cy.deselectAll()
        cy.get('.nu-controller__content')
          .each($el => {
            cy.wrap($el).select({ force: true })
          })
        cy.get('.nu-tmp .nu-layer').should('have.length', 3)
      })

      it('move text group', () => {
        cy.get('.nu-controller__content')
          .last()
          .dragTo(-50, 0, { force: true })
      })

      it('delete first text layer', () => {
        cy.deselectAll()
        cy.get('.nu-controller__content')
          .eq(0)
          .delete()
      })

      it('lock first text layer', () => {
        cy.get('.nu-controller__content')
          .eq(0)
          .click()
        cy.get('use[*|href="#lock"]')
          .parent()
          .click()
      })

      it('check if the locked layer can moved', () => {
        cy.deselectAll()
        cy.get('.nu-controller__content')
          .eq(0)
          .then($beforeEl => {
            const ogRect = $beforeEl[0].getBoundingClientRect()
            cy.wrap($beforeEl)
              .dragTo(100, 0)
            cy.wrap($beforeEl)
              .then($afterEl => {
                const newRect = $afterEl[0].getBoundingClientRect()
                expect(newRect).to.deep.equal(ogRect)
              })
          })
      })

      it('check if the normal layer can moved', () => {
        cy.deselectAll()
        cy.get('.nu-controller__content')
          .eq(1)
          .then($beforeEl => {
            const ogRect = $beforeEl[0].getBoundingClientRect()
            cy.wrap($beforeEl)
              .dragTo(100, 0)
            cy.wrap($beforeEl)
              .then($afterEl => {
                const newRect = $afterEl[0].getBoundingClientRect()
                expect(newRect).to.deep.not.equal(ogRect)
              })
          })
      })
      it('takes a screenshot', () => {
        cy.deselectAll()
        cy.screenshot(`${size.width}x${size.height}`, { capture: 'runner' })
      })
    })
  })
})
