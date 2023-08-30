import colors from '../../fixtures/colors.json'

const _sidebarData = [{
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
}, {
  icon: '.svg-upload',
  panelName: 'file',
  componentName: 'file',
  apiUrl: '',
  apiType: '',
  testCategory: ''
}] as ISidebarData[]

function sidebarData(): ISidebarData[]
function sidebarData(condition:
  'has.search' | 'has.category' | 'is.template' | 'is.photo' | 'is.object' | 'is.bg' | 'is.text' | 'is.file'
): ISidebarData[]
function sidebarData(condition: 'template' | 'photo' | 'object' | 'bg' | 'text' | 'file'): ISidebarData
function sidebarData(condition?: string): ISidebarData[] | ISidebarData {
  switch (condition) {
    case 'has.search':
      return _sidebarData.filter((side) => side.panelName !== 'file')
    case 'has.category':
      return _sidebarData.filter((side) => side.testCategory !== '')
    default:
      if (condition && condition.startsWith('is.')) {
        return _sidebarData.filter((side) => side.panelName === condition.replace('is.', ''))
      } else if (condition) {
        return _sidebarData.filter((side) => side.panelName === condition)[0]
      }
      return _sidebarData
  }
}

describe('Testing SidebarPanel', () => {
  beforeEach(() => {
    cy.login()
  })

  it('Keep scroll position', function () {
    cy.visit('/editor')

    for (const panel of sidebarData()) {
      cy.get(panel.icon).click()
      cy.get('.vue-recycle-scroller:visible').scrollTo(0, 300)
    }

    for (const panel of sidebarData()) {
      cy.get(panel.icon).click()
      cy.get('.vue-recycle-scroller:visible')
        .invoke('prop', 'scrollTop')
        .should('eq', 300)
    }
  })

  it('Keep scroll position after search', function () {
    cy.visit('/editor')

    for (const panel of sidebarData('has.search')) {
      cy.get(panel.icon).click()
      cy.get('.vue-recycle-scroller:visible').scrollTo(0, 300)
      cy.get('.search-bar__input').type('紙').type('{enter}')
      cy.get('.vue-recycle-scroller:visible').scrollTo(0, 300)
    }

    for (const panel of sidebarData('has.search')) {
      cy.get(panel.icon).click()
      cy.get('.vue-recycle-scroller:visible')
        .invoke('prop', 'scrollTop')
        .should('eq', 300)
    }

    for (const panel of sidebarData('has.search')) {
      cy.get(panel.icon).click()
      cy.get('.search-bar > .svg-close').click()
      cy.get('.vue-recycle-scroller:visible')
        .invoke('prop', 'scrollTop')
        .should('eq', 300)
    }
  })

  it('Open sidebar panel by url', function () {
    for (const panel of sidebarData()) {
      cy.visit(`/editor?panel=${panel.panelName}`)

      // Check icon color
      cy.get(panel.icon).should('have.css', 'color', colors.blue1)

      // Check content type
      const itemClass = ['photo', 'file'].includes(panel.panelName)
        ? '.gallery-photo__img'
        : `.panel-${panel.componentName}__item`
      cy.get(`.panel > .panel-${panel.componentName}
          > .vue-recycle-scroller:visible ${itemClass}`)
    }
  })

  it('Search keyword in sidebar panel by url', function () {
    for (const panel of sidebarData('has.search')) {
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
      const itemClass = ['photo', 'file'].includes(panel.panelName)
        ? '.gallery-photo__img'
        : `.panel-${panel.componentName}__item`
      cy.get(`.panel > .panel-${panel.componentName}
          > .vue-recycle-scroller:visible ${itemClass}`)
    }
  })

  it('Search category in sidebar panel by url', function () {
    for (const panel of sidebarData('has.category')) {
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

  // TODO
  // it('Add template item to page', function () {
  // })

  it('Add image item to page', function () {
    const panel = sidebarData('photo')
    cy.visit('/editor')
    for (let i = 1; i < 5; i++) {
      cy.addAsset(panel, i, 0)
      cy.deleteAllLayers()
    }
  })

  // it('Add object item to page', function () {
  //   const panel = sidebarData('object')
  //   cy.visit('/editor')
  //   // cy.getAllCategoryName(panel).then((categoryNames) => {
  //   for (let i = 1; i < 3; i++) {
  //     cy.addAsset(panel, i, 0)
  //     cy.deleteAllLayers()
  //   }
  // })

  it('Add bg item to page', function () {
    const panel = sidebarData('bg')
    cy.visit('/editor')
    // cy.getAllCategoryName(panel).then((categoryNames) => {
    for (let i = 1; i < 4; i++) {
      cy.addAsset(panel, i, 0)
      cy.deleteAllLayers()
    }
  })

  // TODO
  // it('Add text item to page', function () {
  // })

  it('Add myfile item to page', function () {
    const panel = sidebarData('file')
    cy.visit('/editor')
    for (let i = 1; i < 5; i++) {
      cy.addAsset(panel, i, 0)
      cy.deleteAllLayers()
    }
  })
})
