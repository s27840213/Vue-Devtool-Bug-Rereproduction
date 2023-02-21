// ***********************************************
// This example commands.ts shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add('login', (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })
//
// declare global {
//   namespace Cypress {
//     interface Chainable {
//       login(email: string, password: string): Chainable<void>
//       drag(subject: string, options?: Partial<TypeOptions>): Chainable<Element>
//       dismiss(subject: string, options?: Partial<TypeOptions>): Chainable<Element>
//       visit(originalFn: CommandOriginalFn, url: string, options: Partial<VisitOptions>): Chainable<Element>
//     }
//   }
// }
import { cloneDeep, uniq } from 'lodash'
import loginData from '../fixtures/loginData.json'

Cypress.Commands.add('isMobile', (callback: () => void) => {
  cy.get('#app').invoke('prop', '__vue_app__').its('config.globalProperties.$isTouchDevice').then((isMobile: () => boolean) => {
    if (isMobile()) callback()
  })
})

Cypress.Commands.add('notMobile', (callback: () => void) => {
  cy.get('#app').invoke('prop', '__vue_app__').its('config.globalProperties.$isTouchDevice').then((isMobile: () => boolean) => {
    if (!isMobile()) callback()
  })
})

Cypress.Commands.add('waitTransition', { prevSubject: 'element' }, (subject) => {
  cy.wrap(subject).invoke('prop', 'class')
    .should('not.match', /(-leave-active|-enter-active)/)
  return cy.wrap(subject)
})

Cypress.Commands.add('login', () => {
  cy.request('POST', 'https://apiv2.vivipic.com/login', loginData.email)
    .then((response) => {
      window.localStorage.setItem('token', response.body.data.token)
    })
})

Cypress.Commands.add('deleteAllLayers', () => {
  cy.get('body').type('{ctrl+A}').type('{del}')
})

Cypress.Commands.add('deselectAllLayers', () => {
  cy.get('.pages-wrapper').eq(0).type('{ctrl+D}')
    .get('.page-control').children().should('have.length', 0)
})

Cypress.Commands.add('importDesign', (designName: string) => {
  // TODO: Use @/ instead of ../
  const designJson = cloneDeep(require(`../fixtures/design/${designName}`))
  cy.get('#app').invoke('prop', '__vue_app__').its('config.globalProperties.$store').then((vuex) => {
    vuex.commit('SET_pages', designJson)
  })
})

Cypress.Commands.add('togglePanel', (buttonText: string) => {
  cy.get('#app').invoke('prop', '__vue_app__').its('config.globalProperties.$isTouchDevice').then((isMobile: () => boolean) => {
    if (isMobile()) {
      cy.get('.footer-tabs').contains('div', buttonText)
        .should('not.have.class', 'click-disabled')
        .click()
        .get('.mobile-panel').waitTransition()
    } else {
      cy.get('.function-panel').contains(buttonText).click()
    }
  })
})

Cypress.Commands.add('getAllCategoryName', (panel: ISidebarData, categoryName = [], last = false) => {
  cy.get(panel.icon).click()
  cy.get(`.panel > .panel-${panel.componentName}
        > .vue-recycle-scroller:visible
        .category-list-rows__header > div:first-child`).its('length').should('be.greaterThan', 4)

  cy.intercept({
    url: panel.apiUrl,
    query: {
      type: panel.apiType,
      list_category: '1',
    }
  }).as(`search-${panel.apiType}`)

  return cy.get(`.panel > .panel-${panel.componentName}
          > .vue-recycle-scroller:visible
          .category-list-rows__header > div:first-child`).then((titles) => {
    categoryName.push(...titles.toArray().map((title: HTMLElement) => title.textContent))
    categoryName = uniq(categoryName)
  }).get(`.panel > .panel-${panel.componentName}
    > .vue-recycle-scroller:visible`).scrollTo(0, 999999)
    .wait(`@search-${panel.apiType}`).its('response.body')
    .then((body) => {
      if (last) return cy.wrap(categoryName)
      else if (body.data.next_page === -1) cy.getAllCategoryName(panel, categoryName, true)
      else return cy.getAllCategoryName(panel, categoryName)
    })
})

function formatPath(path: string) {
  path = path.replace(/([A-Za-z])/g, ' $1 ')
    .replace(/,/g, ' ')
    .replace(/ {2}/g, '')
    .replace(/z/, 'Z')
  while (path.match(/[\d]+\.[\d]{4,}/)) {
    path = path.replace(/[\d]+\.[\d]{4,}/, Number(path.match(/[\d]+\.[\d]{4,}/)[0]).toFixed(3))
  }
  path = path.trim()
  return path
}

function addAsset(panel: ISidebarData, categoryIndex: number, itemIndex: number): void
// function addAsset(panel: ISidebarData, categoryName: string, itemIndex: number): void
function addAsset(panel: ISidebarData, category: string | number, itemIndex: number): void {
  // Calc category index
  let categoryIndex: number
  if (typeof category === 'number') {
    categoryIndex = category
  } else {
    // TODO: Search category name
    throw new Error('TODO: search category name in addAsset command.')
  }

  // Get nu-layer exist in nu-page
  cy.get('.nu-page-0 .content').children().then((oldChildren) => {
    // Switch sidebar panel
    cy.get(panel.icon).click()

    // Find target item we want to add
    if (itemIndex < 3) {
      cy.get(`.panel > .panel-${panel.componentName}
            > .vue-recycle-scroller:visible
            .vue-recycle-scroller__item-view`)
        .eq(categoryIndex)
        .find('img').eq(itemIndex).as('target')
    } else {
      // Click more button in category
      cy.get(`.panel > .panel-${panel.componentName}
            > .vue-recycle-scroller:visible
            .vue-recycle-scroller__item-view`)
        .eq(categoryIndex).find('.category-list-rows__action').click()
      cy.get(`.panel > .panel-${panel.componentName}
        > .vue-recycle-scroller:visible
        .vue-recycle-scroller__item-view`).find('img').eq(itemIndex).as('target')
    }

    switch (panel.panelName) {
      case 'template':
        break
      case 'photo':
        // Check nu-image src
        cy.get('@target').click().invoke('attr', 'src').then((targetSrc) => {
          targetSrc = targetSrc.match(/https:\/\/images.unsplash.com\/photo-[\d]+-[\w]+/)[0]

          cy.get('#nu-page_0 .nu-layer .nu-image img.nu-image__picture')
            .invoke('attr', 'src').should('contain', targetSrc)
        })
        break
      case 'object': {
        let targetSrc: string
        cy.get('@target').invoke('attr', 'src').then((_targetSrc) => {
          targetSrc = _targetSrc.match(/https:\/\/template.vivipic.com\/svg\/([\w]+)/)[0]

          const objId = targetSrc.match(/https:\/\/template.vivipic.com\/svg\/([\w]+)/)[1]
          const apiUrl = `/svg/${objId}/config.json*`
          cy.intercept(apiUrl).as('fetchConfig')
        })

        cy.get('@target').click()
        cy.get('.nu-page-0 .content').children().should('have.length', oldChildren.length + 1)
          .then((newChildren) => newChildren.not(oldChildren))
          .children().eq(0).children().eq(0).children().eq(0).children().eq(0).children().should('have.length', 1)
          .then((nuLayer) => {
            if (nuLayer.hasClass('nu-image')) {
              cy.wrap(nuLayer).find('img.nu-image__picture')
                .invoke('attr', 'src').should('contain', targetSrc)
            } else if (nuLayer.hasClass('nu-frame')) {
              cy.wait('@fetchConfig').its('response.body').then((body) => {
                for (const clip of body.clips) {
                  const currClipPath = formatPath(clip.clipPath)
                  cy.wrap(nuLayer).find('.nu-layer').then((nuLayerInFrame) => {
                    for (const layer of nuLayerInFrame) {
                      if (`path("${currClipPath}")` === layer.style.clipPath) {
                        expect(`path("${currClipPath}")`).to.eq(layer.style.clipPath)
                        return
                      }
                    }
                    throw new Error(`Cannot find nu-frame clipPath ${currClipPath}`)
                  })
                }
              })
            } else if (nuLayer.hasClass('nu-shape')) {
              cy.wait('@fetchConfig').its('response.body').then((body) => {
                body = JSON.parse(body)
                cy.get('#nu-page_0 .nu-layer .nu-shape svg').as('svg')
                switch (body.category) {
                  case 'E':
                    switch (body.shapeType) {
                      case 'e':
                        cy.get('@svg').find('> defs:first-child > ellipse').should('have.attr', 'cx')
                        cy.get('@svg').find('> defs:first-child > ellipse').should('have.attr', 'cy')
                        cy.get('@svg').find('> defs:first-child > ellipse').should('have.attr', 'rx')
                        cy.get('@svg').find('> defs:first-child > ellipse').should('have.attr', 'ry')
                        break
                      case 'r':
                        cy.get('@svg').find('> defs:first-child > path').invoke('attr', 'd')
                          .should('match', /M [.\d]+ 0 a [.\d]+ [.\d]+ 0 0 0 -[.\d]+ [.\d]+ v [.\d]+ a [.\d]+ [.\d]+ 0 0 0 [.\d]+ [.\d]+ h [.\d]+ a [.\d]+ [.\d]+ 0 0 0 [.\d]+ -[.\d]+ v -[.\d]+ a [.\d]+ [.\d]+ 0 0 0 -[.\d]+ -[.\d]+ z/)
                        break
                      case 't':
                        cy.get('@svg').find('> defs:first-child > path').invoke('attr', 'd')
                          .should('match', /M [.\d]+ 0 m [.\d]+ [.\d]+ a [.\d]+ [.\d]+ 0 0 0 -[.\d]+ 0 l -[.\d]+ [.\d]+ a [.\d]+ [.\d]+ 0 0 0 [.\d]+ [.\d]+ h [.\d]+ a [.\d]+ [.\d]+ 0 0 0 [.\d]+ -[.\d]+ z/)
                        break
                      default:
                        throw new Error(`Config type shape has a unexpected shapeType which is ${body.shapeType}.`)
                    }
                    break
                }
              })
            }
          })
        break
      }
      case 'bg':
        // Check nu-bg-image src
        cy.get('@target').click().invoke('attr', 'src').then((targetSrc) => {
          targetSrc = targetSrc.match(/https:\/\/template.vivipic.com\/background\/[\w]+/)[0]

          cy.get('#nu-page_0 .nu-background-image img')
            .invoke('attr', 'src').should('contain', targetSrc)
        })
        break
      case 'text':
        break
      case 'file':
        // Check nu-image src
        cy.get('@target').click().invoke('attr', 'src').then((targetSrc) => {
          targetSrc = targetSrc.match(/https:\/\/asset.vivipic.com\/[\w]+\/asset\/image\/[\w]+\//)[0]

          cy.get('#nu-page_0 .nu-layer .nu-image img.nu-image__picture')
            .invoke('attr', 'src').should('contain', targetSrc)
        })
        break
    }

    if (itemIndex > 2) {
      cy.get('.search-bar > .svg-close').click()
    }
  })
}

Cypress.Commands.add('addAsset', addAsset)

// Plz check doc to add correct type define for custom command:
// https://docs.cypress.io/guides/tooling/typescript-support#Types-for-Custom-Commands

// If you want to define a command that use prevSubject
// Define type in infex.d.ts like this:
//   commandName(): Chainable<JQuery<HTMLElement>>
// Implement like this:
//   Cypress.Commands.add('commandName', { prevSubject: 'element' }, (subject) => {
//     return cy.wrap(subject)
//   })
