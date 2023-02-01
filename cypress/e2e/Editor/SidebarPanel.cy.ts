import colors from '../../fixtures/colors.json'

const sidebarData = [{
  icon: '.svg-template',
  panelName: 'template',
  componentName: 'template',
  apiUrl: '/list-design*',
  apiType: 'template',
  testCategory: '新品上架'
}, {
  icon: '.svg-photo',
  panelName: 'photo',
  componentName: 'photo',
  apiUrl: '/list-lib-photo*',
  apiType: 'unsplash',
  testCategory: ''
}, {
  icon: '.svg-objects',
  panelName: 'object',
  componentName: 'objects',
  apiUrl: '/list-design*',
  apiType: 'svg',
  testCategory: '線條與形狀'
}, {
  icon: '.svg-bg',
  panelName: 'bg',
  componentName: 'bg',
  apiUrl: '/list-design*',
  apiType: 'background',
  testCategory: '木紋'
}, {
  icon: '.svg-text',
  panelName: 'text',
  componentName: 'text',
  apiUrl: '/list-design*',
  apiType: 'text',
  testCategory: '手繪感'
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

  it('Search keyword in sidebar panel by url', () => {
    for (const panel of sidebarData) {
      const keyword = panel.panelName === 'photo' ? '紙' : 'tag::紙'
      cy.intercept({
        url: panel.apiUrl,
        query: {
          type: panel.apiType,
          keyword: keyword
        }
      }).as(`search-${panel.apiType}`)

      cy.visit(encodeURI(`/editor?panel=${panel.panelName}&search=紙`))

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

  it('Search category in sidebar panel by url', () => {
    for (const panel of sidebarData) {
      if (panel.panelName === 'photo') continue

      cy.intercept({
        url: panel.apiUrl,
        query: {
          type: panel.apiType,
          keyword: `${panel.testCategory}`
        }
      }).as(`search-${panel.apiType}`)

      cy.visit(encodeURI(`/editor?panel=${panel.panelName}&category=${panel.testCategory}&category_locale=tw`))

      // Check api
      cy.wait(`@search-${panel.apiType}`).its('response.body')
        .then((body) => {
          expect(body.flag).to.match(/0/)
          expect(body.data.content[0].list.length).to.greaterThan(0)
        })

      // Check icon color
      cy.get(panel.icon).should('have.css', 'color', colors.blue1)

      // Check content type
      const itemClass = `.panel-${panel.componentName}__item`
      cy.get(`.panel > .panel-${panel.componentName}
          > .vue-recycle-scroller:visible ${itemClass}`)
    }
  })
})
