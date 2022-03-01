const sizes = [
  { width: 1080, height: 1080 },
  { width: 1080, height: 1920 }
]

describe('Flow: Image, Text, Group', () => {
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

      it('add first image', () => {
        cy.intercept({
          url: 'https://api.unsplash.com/photos*'
        }).as('unsplashApi')
        cy.contains('Photos').click()
        cy.wait('@unsplashApi')
        cy.get('.gallery-photo__img')
          .eq(0)
          .click()

        cy.get('.nu-controller__content')
          .eq(0)
          .dragTo(0, -200)
      })

      it('add second image', () => {
        cy.get('.gallery-photo__img')
          .eq(1)
          .click()
        cy.wait(500)
        cy.get('.control-point')
          .eq(2)
          .dragTo(-100, -100)
        cy.get('.nu-controller__content')
          .eq(0)
          .click({ force: true })
      })

      it('add subheading', () => {
        cy.get('.btn-text-subheading').click()
        cy.wait(500)
        cy.get('.text__body')
          .type('{selectall}{backspace}Vivipic最棒了')
        cy.deselectAll()
        cy.get('.nu-controller__content')
          .eq(3)
          .dragTo(0, 50)
      })

      it('select all', () => {
        cy.deselectAll()
        cy.selectAll()

        cy.get('.nu-controller__content')
          .trigger('mousedown', { force: true })
          .trigger('mouseup', { force: true })
      })

      it('rotate 30deg', () => {
        cy.get('.control-point__rotater')
          .dragTo(-20, 20 * Math.sqrt(3))
      })

      it('zoom in', () => {
        cy.get('.control-point')
          .eq(2)
          .dragTo(30, 30)
      })

      it('rotate -45deg', () => {
        cy.get('.control-point__rotater')
          .dragTo(50, 50 * (2 + Math.sqrt(3)))
      })

      it('zoom out', () => {
        cy.get('.control-point')
          .eq(3)
          .dragTo(30, -30)
      })

      it('text grouping', () => {
        cy.deselectAll()

        cy.get('.nu-controller__content')
          .eq(2)
          .select()

        cy.get('.nu-controller__content')
          .eq(3)
          .select()
      })

      it('move text group', () => {
        cy.get('.nu-controller__content')
          .last()
          .dragTo(50, 0, { force: true })
      })

      it('takes a screenshot', () => {
        cy.deselectAll()
        cy.screenshot(`${size.width}x${size.height}`, { capture: 'runner' })
      })
    })
  })
})
