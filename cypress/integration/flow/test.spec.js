const sizes = [
  { width: 1080, height: 1080 },
  { width: 1080, height: 1920 }
]
describe('Flow: Image, Text, Group', () => {
  it('visit page', () => {
    cy.visit('http://localhost:8080/')
  })

  sizes.forEach(size => {
    const btnText = `${size.width}x${size.height} px`

    it(`select page format ${btnText}`, () => {
      // add new design
      cy.contains('New Design')
        .click();
      cy.contains('Templates')
        .click();

      // select format
      cy.contains(btnText).click()
      cy.get('.page-content')
        .first()
        .should('have.attr', 'style')
        .and('match', RegExp(`width: ${size.width}px`))
        .and('match', RegExp(`height: ${size.height}px`))

      // add first image
      cy.intercept({
        url: 'https://api.unsplash.com/photos*'
      }).as('unsplashApi')
      cy.contains('Photos').click()
      cy.wait('@unsplashApi')
      cy.get('.gallery-photo__img').eq(0).click()

      cy.get('.nu-controller__content')
        .eq(0)
        .trigger('mousedown', 20, 20)
        .trigger('mousemove', 20, -200, { force: true })
        .trigger('mouseup', { force: true })

      // add second image
      cy.get('.gallery-photo__img').eq(1).click()
      cy.wait(1000)
      cy.get('.nu-controller__content')
        .eq(1)
        .then($el => {
          const { left, top } = $el.position()
          const width = $el.width()
          const height = $el.height()
          cy.get('.pages-wrapper')
            .first()
            .trigger('mousedown', left + width, top)
            .trigger('mousemove', left + width * 0.7, top + height * 0.3, { force: true })
            .trigger('mouseup', { force: true })
          
          cy.get('.nu-controller__content').eq(0).click()
        })

      // add heading
      cy.intercept('POST', '/list-design').as('listApi')
      cy.contains('Text').click()
      cy.wait('@listApi')
      cy.get('.btn-text-heading').click()
      cy.wait(1000)
      cy.get('.text__body')
        .click()
        .type('{selectall}{backspace}我最愛Vivipic')

      cy.get('.nu-controller__content')
        .eq(2)
        .then($el => {
          const offsetx = $el.width() / 2
          const offsety = $el.height() / 2
          const { left, top } = $el.position()
          cy.get('.pages-wrapper')
            .first()
            .click(0, 0)
          cy.get('.nu-text')
            .click({ force: true })
          cy.get('.pages-wrapper')
            .first()
            .trigger('mousedown', left + offsetx, top + offsety)
            .trigger('mousemove', left + offsetx + 100, top + offsety, { force: true })
            .trigger('mouseup', { force: true })
        })

      // add subheading
      cy.get('.btn-text-subheading').click()
      cy.wait(1000)
      cy.get('.text__body')
        .click()
        .type('{selectall}{backspace}Vivipic最棒了')
  
      cy.get('.nu-controller__content')
        .eq(3)
        .then($el => {
          const offsetx = $el.width() / 2
          const offsety = $el.height() / 2
          const { left, top } = $el.position()
          cy.get('.pages-wrapper')
            .first()
            .click(0, 0)
          cy.get('.nu-text')
            .eq(1)
            .click({ force: true })
          cy.get('.pages-wrapper')
            .first()
            .trigger('mousedown', left + offsetx, top + offsety)
            .trigger('mousemove', left + offsetx, top + offsety + 50, { force: true })
            .trigger('mouseup', { force: true })
        })

      // select all
      cy.get('.pages-wrapper')
        .first()
        .click()
        .type('{meta}d')
        .type('{meta}a')

      cy.get('.nu-controller__content')
        .trigger('mousedown', { force: true })
        .trigger('mouseup', { force: true })

      // rotate 30deg
      cy.get('.nu-controller__content')
        .then($el => {
          const { top, left } = $el.position()
          const width = $el.width()
          const height = $el.height()

          const rotater = {
            x: left + (width / 2),
            y: top + height + 15,
          }
          const destination = {
            x: rotater.x - 20,
            y: rotater.y + (20 * Math.sqrt(3))
          }

          cy.get('.pages-wrapper')
            .first()
            .trigger('mousedown', rotater.x, rotater.y)
            .trigger('mousemove', destination.x, destination.y, { force: true })
            .trigger('mouseup', { force: true })
        })

      cy.get('.pages-wrapper')
        .first()
        .click()
        .type('{meta}d')
        .type('{meta}a')

      cy.get('.nu-controller__content')
        .trigger('mousedown', { force: true })
        .trigger('mouseup', { force: true })

      // zoom in
      cy.get('.nu-controller__content')
        .then($el => {
          const { top, left } = $el.position()
          cy.get('.control-point')
            .eq(2)
            .then($el => {
              const scaleBtn = {
                x: left + $el.position().left + 2,
                y: top + $el.position().top + 2
              }
              cy.get('.pages-wrapper')
                .first()
                .trigger('mousedown', scaleBtn.x, scaleBtn.y)
                .trigger('mousemove', scaleBtn.x + 30, scaleBtn.y + 30, { force: true })
                .trigger('mouseup', { force: true })
            })
        })

      // rotate -45deg
      cy.get('.nu-controller__content')
        .then($el => {
          const { top, left } = $el.position()
          cy.get('.control-point__rotater-wrapper')
            .then($el => {
              const rotater = {
                x: left + $el.position().left + 15,
                y: top + $el.position().top + 15
              }
              cy.get('.pages-wrapper')
                .first()
                .trigger('mousedown', rotater.x, rotater.y)
                .trigger('mousemove', rotater.x + 50, rotater.y + 50 * (2 + Math.sqrt(3)), { force: true })
                .trigger('mouseup', { force: true })
            })
        })

      // zoom out
      cy.get('.nu-controller__content')
        .then($el => {
          const { top, left } = $el.position()
          cy.get('.control-point')
            .eq(3)
            .then($el => {
              const scaleBtn = {
                x: left + $el.position().left + 2,
                y: top + $el.position().top + 2
              }
              cy.wrap($el)
                .trigger('mousedown')

              cy.get('.pages-wrapper')
                .first()
                .trigger('mousemove', scaleBtn.x, scaleBtn.y, { force: true })
                .trigger('mousemove', scaleBtn.x + 30, scaleBtn.y - 30, { force: true })
                .trigger('mouseup', { force: true })
            })
        })

      // text grouping
      cy.get('.pages-wrapper')
        .first()
        .click()
        .type('{meta}d')
  
      cy.get('.nu-controller__content')
        .eq(2)
        .then($el => {
          const { left, top } = $el.position()
          const width = $el.width()
          const height = $el.height()
          cy.get('.pages-wrapper')
            .first()
            .trigger('mousedown', left + width / 2, top + height / 2)
            .trigger('mouseup', left + width / 2, top + height / 2, { force: true })
        })

      cy.get('.nu-controller__content')
        .eq(3)
        .then($el => {
          const { left, top } = $el.position()
          const width = $el.width()
          const height = $el.height()
          cy.get('.pages-wrapper')
            .first()
            .trigger('mousedown', left + width / 2, top + height / 2, { shiftKey: true })
            .trigger('mouseup', left + width / 2, top + height / 2, { force: true })
        })

      // move text grou
      cy.get('.nu-controller__content')
        .last()
        .then($el => {
          const { left, top } = $el.position()
          const w = $el.width() / 4
          const h = $el.height() / 4
          cy.get('.pages-wrapper')
            .first()
            .trigger('mousedown', left + w, top + h)
            .trigger('mousemove', left + w + 50, top + h, { force: true })

          cy.get('.pages-wrapper')
            .first()
            .trigger('mouseup')
        })

      // takes a screenshot
      cy.get('.pages-wrapper')
        .first()
        .type('{meta}d')
      cy.screenshot(`${size.width}x${size.height}`, { capture: 'runner' })
    })

    // it('add new design', () => {
    //   cy.contains('New Design')
    //     .click();
    //   cy.contains('Templates')
    //     .click();
    // })

    // it(`select page format ${btnText}`, () => {
    //   cy.contains(btnText).click()
    //   cy.get('.page-content')
    //     .first()
    //     .should('have.attr', 'style')
    //     .and('match', RegExp(`width: ${size.width}px`))
    //     .and('match', RegExp(`height: ${size.height}px`))
    // })

    // it('add first image', () => {
    //   cy.intercept({
    //     url: 'https://api.unsplash.com/photos*'
    //   }).as('unsplashApi')
    //   cy.contains('Photos').click()
    //   cy.wait('@unsplashApi')
    //   cy.get('.gallery-photo__img').eq(0).click()

    //   cy.get('.nu-controller__content')
    //     .eq(0)
    //     .trigger('mousedown', 20, 20)
    //     .trigger('mousemove', 20, -200, { force: true })
    //     .trigger('mouseup', { force: true })
    // })

    // it('add second image', () => {
    //   cy.get('.gallery-photo__img').eq(1).click()
    //   cy.wait(1000)
    //   cy.get('.nu-controller__content')
    //     .eq(1)
    //     .then($el => {
    //       const { left, top } = $el.position()
    //       const width = $el.width()
    //       const height = $el.height()
    //       cy.get('.pages-wrapper')
    //         .first()
    //         .trigger('mousedown', left + width, top)
    //         .trigger('mousemove', left + width * 0.7, top + height * 0.3, { force: true })
    //         .trigger('mouseup', { force: true })
    //         .click(0, 0)
    //     })
    // })

    // it('add heading', () => {
    //   cy.intercept('POST', '/list-design').as('listApi')
    //   cy.contains('Text').click()
    //   cy.wait('@listApi')
    //   cy.get('.btn-text-heading').click()
    //   cy.wait(1000)
    //   cy.get('.text__body')
    //     .click()
    //     .type('{selectall}{backspace}我最愛Vivipic')

    //   cy.get('.nu-controller__content')
    //     .eq(2)
    //     .then($el => {
    //       const offsetx = $el.width() / 2
    //       const offsety = $el.height() / 2
    //       const { left, top } = $el.position()
    //       cy.get('.pages-wrapper')
    //         .first()
    //         .click(0, 0)
    //       cy.get('.nu-text')
    //         .click({ force: true })
    //       cy.get('.pages-wrapper')
    //         .first()
    //         .trigger('mousedown', left + offsetx, top + offsety)
    //         .trigger('mousemove', left + offsetx + 100, top + offsety, { force: true })
    //         .trigger('mouseup', { force: true })
    //     })
    // })
  
    // it('add subheading', () => {
    //   cy.get('.btn-text-subheading').click()
    //   cy.wait(1000)
    //   cy.get('.text__body')
    //     .click()
    //     .type('{selectall}{backspace}Vivipic最棒了')
  
    //   cy.get('.nu-controller__content')
    //     .eq(3)
    //     .then($el => {
    //       const offsetx = $el.width() / 2
    //       const offsety = $el.height() / 2
    //       const { left, top } = $el.position()
    //       cy.get('.pages-wrapper')
    //         .first()
    //         .click(0, 0)
    //       cy.get('.nu-text')
    //         .eq(1)
    //         .click({ force: true })
    //       cy.get('.pages-wrapper')
    //         .first()
    //         .trigger('mousedown', left + offsetx, top + offsety)
    //         .trigger('mousemove', left + offsetx, top + offsety + 50, { force: true })
    //         .trigger('mouseup', { force: true })
    //     })
    // })

    // it('select all', () => {
    //   cy.get('.pages-wrapper')
    //     .first()
    //     .click()
    //     .type('{meta}d')
    //     .type('{meta}a')

    //   cy.get('.nu-controller__content')
    //     .trigger('mousedown', { force: true })
    //     .trigger('mouseup', { force: true })
    // })

    // it('rotate 30deg', () => {
    //   cy.get('.nu-controller__content')
    //     .then($el => {
    //       const { top, left } = $el.position()
    //       const width = $el.width()
    //       const height = $el.height()
  
    //       const rotater = {
    //         x: left + (width / 2),
    //         y: top + height + 15,
    //       }
    //       const destination = {
    //         x: rotater.x - 20,
    //         y: rotater.y + (20 * Math.sqrt(3))
    //       }
  
    //       cy.get('.pages-wrapper')
    //         .first()
    //         .trigger('mousedown', rotater.x, rotater.y)
    //         .trigger('mousemove', destination.x, destination.y, { force: true })
    //         .trigger('mouseup', { force: true })
    //     })
    // })
  
    // it('zoom in', () => {
    //   cy.get('.nu-controller__content')
    //     .then($el => {
    //       const { top, left } = $el.position()
    //       cy.get('.control-point')
    //         .eq(2)
    //         .then($el => {
    //           const scaleBtn = {
    //             x: left + $el.position().left + 2,
    //             y: top + $el.position().top + 2
    //           }
    //           cy.get('.pages-wrapper')
    //             .first()
    //             .trigger('mousedown', scaleBtn.x, scaleBtn.y)
    //             .trigger('mousemove', scaleBtn.x + 30, scaleBtn.y + 30, { force: true })
    //             .trigger('mouseup', { force: true })
    //         })
    //     })
    // })
  
    // it('rotate -45deg', () => {
    //   cy.get('.nu-controller__content')
    //     .then($el => {
    //       const { top, left } = $el.position()
    //       cy.get('.control-point__rotater-wrapper')
    //         .then($el => {
    //           const rotater = {
    //             x: left + $el.position().left + 15,
    //             y: top + $el.position().top + 15
    //           }
    //           cy.get('.pages-wrapper')
    //             .first()
    //             .trigger('mousedown', rotater.x, rotater.y)
    //             .trigger('mousemove', rotater.x + 50, rotater.y + 50 * (2 + Math.sqrt(3)), { force: true })
    //             .trigger('mouseup', { force: true })
    //         })
    //     })
    // })
  
    // it('zoom out', () => {
    //   cy.get('.nu-controller__content')
    //     .then($el => {
    //       const { top, left } = $el.position()
    //       cy.get('.control-point')
    //         .eq(2)
    //         .then($el => {
    //           const scaleBtn = {
    //             x: left + $el.position().left + 2,
    //             y: top + $el.position().top + 2
    //           }
    //           cy.get('.pages-wrapper')
    //             .first()
    //             .trigger('mousedown', scaleBtn.x, scaleBtn.y)
    //             .trigger('mousemove', scaleBtn.x - 30, scaleBtn.y - 30, { force: true })
    //             .trigger('mouseup', { force: true })
    //         })
    //     })
    // })
  
    // it('text grouping', () => {
    //   cy.get('.pages-wrapper')
    //     .first()
    //     .click(0, 0)
  
    //   cy.get('.nu-controller__content')
    //     .eq(2)
    //     .then($el => {
    //       const { left, top } = $el.position()
    //       const width = $el.width()
    //       const height = $el.height()
    //       cy.get('.pages-wrapper')
    //         .first()
    //         .trigger('mousedown', left + width / 2, top + height / 2)
    //         .trigger('mouseup', left + width / 2, top + height / 2, { force: true })
    //     })
      
    //   cy.get('.nu-controller__content')
    //     .eq(3)
    //     .then($el => {
    //       const { left, top } = $el.position()
    //       const width = $el.width()
    //       const height = $el.height()
    //       cy.get('.pages-wrapper')
    //         .first()
    //         .trigger('mousedown', left + width / 2, top + height / 2, { shiftKey: true })
    //         .trigger('mouseup', left + width / 2, top + height / 2, { force: true })
    //     })
    // })

    // it('move text group', () => {
    //   cy.get('.nu-controller__content')
    //     .last()
    //     .then($el => {
    //       const { left, top } = $el.position()
    //       cy.get('.pages-wrapper')
    //         .first()
    //         .trigger('mousedown', left + 10, top + 10)
    //         .trigger('mousemove', left + 60, top + 10, { force: true })

    //       cy.get('.pages-wrapper')
    //         .first()
    //         .trigger('mouseup')
    //     })
    // })

    // it('takes a screenshot', () => {
    //   cy.get('.pages-wrapper')
    //     .first()
    //     .type('{meta}d')
    //   cy.screenshot(`${size.width}x${size.height}`, { capture: 'runner' })
    // })
  })
})
