const sidebarData = [{
  icon: '.svg-template'
}, {
  icon: '.svg-photo'
}, {
  icon: '.svg-objects'
}, {
  icon: '.svg-bg'
}, {
  icon: '.svg-text'
}]

describe('Testing SidebarPanel', () => {
  beforeEach(() => {
    cy.login()
  })

  it('keep scroll position', () => {
    cy.visit('/editor')

    for (const panel of sidebarData) {
      cy.get(panel.icon).click()
      cy.get('.vue-recycle-scroller:visible').scrollTo(0, 300).wait(150)
    }

    for (const panel of sidebarData) {
      cy.get(panel.icon).click()
      cy.get('.vue-recycle-scroller:visible')
        .invoke('prop', 'scrollTop')
        .should('eq', 300)
    }
  })

  it('keep scroll position after search', () => {
    cy.visit('/editor')

    for (const panel of sidebarData) {
      cy.get(panel.icon).click()
      cy.get('.vue-recycle-scroller:visible').scrollTo(0, 300).wait(150)
      cy.get('.search-bar__input').type('紙').type('{enter}')
      cy.get('.vue-recycle-scroller:visible').scrollTo(0, 300).wait(150)
    }

    for (const panel of sidebarData) {
      cy.get(panel.icon).click()
      cy.get('.vue-recycle-scroller:visible')
        .invoke('prop', 'scrollTop')
        .should('eq', 300)
    }

    for (const panel of sidebarData) {
      cy.get(panel.icon).click()
      cy.get('.search-bar > .svg-close').click()
      cy.get('.vue-recycle-scroller:visible')
        .invoke('prop', 'scrollTop')
        .should('eq', 300)
    }
  })
})
