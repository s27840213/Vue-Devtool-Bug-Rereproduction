import colors from '../../fixtures/colors.json'

const sidebarData = [{
  icon: '.svg-template',
  panelName: 'template',
  componentName: 'template',
  apiUrl: '/list-design*',
  apiType: 'template'
}, {
  icon: '.svg-photo',
  panelName: 'photo',
  componentName: 'photo',
  apiUrl: '/list-lib-photo*',
  apiType: 'unsplash'
}, {
  icon: '.svg-objects',
  panelName: 'object',
  componentName: 'objects',
  apiUrl: '/list-design*',
  apiType: 'svg'
}, {
  icon: '.svg-bg',
  panelName: 'bg',
  componentName: 'bg',
  apiUrl: '/list-design*',
  apiType: 'background'
}, {
  icon: '.svg-text',
  panelName: 'text',
  componentName: 'text',
  apiUrl: '/list-design*',
  apiType: 'text'
}]

describe('Testing SidebarPanel', () => {
  beforeEach(() => {
    cy.login()
  })

  it('Keep scroll position', () => {
    cy.visit('/editor')

    for (const panel of sidebarData) {
      cy.get(panel.icon).click()
      cy.get('.vue-recycle-scroller:visible').scrollTo(0, 300)
    }

    for (const panel of sidebarData) {
      cy.get(panel.icon).click()
      cy.get('.vue-recycle-scroller:visible')
        .invoke('prop', 'scrollTop')
        .should('eq', 300)
    }
  })

  it('Keep scroll position after search', () => {
    cy.visit('/editor')

    for (const panel of sidebarData) {
      cy.get(panel.icon).click()
      cy.get('.vue-recycle-scroller:visible').scrollTo(0, 300)
      cy.get('.search-bar__input').type('紙').type('{enter}')
      cy.get('.vue-recycle-scroller:visible').scrollTo(0, 300)
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

  it('Open sidebar panel by url', () => {
    for (const panel of sidebarData) {
      cy.visit(`/editor?panel=${panel.panelName}`)

      // Check icon color
      cy.get(panel.icon).should('have.css', 'color', colors.blue1)

      // Check content type
      const itemClass = panel.panelName === 'photo'
        ? '.gallery-photo__img'
        : `.panel-${panel.componentName}__item`
      cy.get(`.panel > .panel-${panel.componentName}
          > .vue-recycle-scroller:visible ${itemClass}`)
    }
  })

  it('Search keyword sidebar panel by url', () => {
    for (const panel of sidebarData) {
      const keyword = panel.panelName === 'photo' ? '紙' : 'tag::紙'
      cy.intercept({
        url: panel.apiUrl,
        query: {
          type: panel.apiType,
          keyword: keyword
        }
      }).as(`search-${panel.apiType}`)

      cy.visit(`/editor?panel=${panel.panelName}&search=%E7%B4%99`)

      // Check api
      cy.wait(`@search-${panel.apiType}`).its('response.body')
        .then((body) => {
          expect(body.flag).to.match(/0/)
          expect(body.data.content[0].list.length).to.greaterThan(0)
        })

      // Check icon color
      cy.get(panel.icon).should('have.css', 'color', colors.blue1)

      // Check content type
      const itemClass = panel.panelName === 'photo'
        ? '.gallery-photo__img'
        : `.panel-${panel.componentName}__item`
      cy.get(`.panel > .panel-${panel.componentName}
          > .vue-recycle-scroller:visible ${itemClass}`)
    }
  })
})
