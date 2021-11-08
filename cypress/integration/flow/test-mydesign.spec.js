/*
** After design API is done, 
** add something to querystring for using testing folders 
** and designs instead of using user designs
*/

var toggleFolderExpansion = (level, nth = 0) => {
  cy.get(`.nav-folder-${level}`).eq(nth).children('.nav-folder__expand-icon-container').click()
}

var getSidebarFolder = (level, nth = undefined) => {
  let res = cy.get(`.nav-folder-${level}`)
  if (nth !== undefined) {
    res = res.eq(nth)
  }
  return res
}

var getSidebarRow = (name) => {
  const names = ['all', 'favorite', 'trash']
  const index = names.indexOf(name)
  if (index < 0) throw new Error('no such sidebar row')
  return cy.get('.nav-item').eq(index)
}

describe('MyDesign', () => {
  beforeEach(() => {
    cy.visit('http://localhost:8080/mydesign?token=OvODomMEzmmUBXXP')
  })

  describe('Sidebar', () => {
    it('shows folder structure', () => {
      cy.contains('Toby').should('exist')
      cy.contains('日本行銷').should('exist')
      getSidebarFolder(1).should('not.exist')
      toggleFolderExpansion(0)
      cy.contains('素材2').should('exist')
      for (let i = 0; i < 4; i++) {
        toggleFolderExpansion(i + 1)
      }
      cy.contains('材質5').should('exist')
      toggleFolderExpansion(0)
      getSidebarFolder(4).should('not.exist')
      toggleFolderExpansion(0)
      cy.contains('材質5').should('exist')
    })

    it('creates new folder', () => {
      cy.get('.nav-item-new-folder__container').click()
      cy.contains('未命名資料夾').should('exist').and('have.class', 'nav-folder-0__text')
    })

    it('has draggble folder rows and moves them when dropping', () => {
      getSidebarFolder(0, 0).dragElementTo(() => getSidebarFolder(0, 2), () => getSidebarFolder(0, 0))
      toggleFolderExpansion(0)
      getSidebarFolder(1).contains('Toby')
      cy.contains('已移至').should('exist')
    })

    it('has draggble folder rows and deletes them when dropping into trashcan', () => {
      cy.contains('日本行銷').parent('.nav-folder-0').dragElementTo(() => getSidebarRow('trash'), () => getSidebarFolder(0, 0))
      getSidebarRow('trash').click()
      cy.contains('已移至垃圾桶').should('exist')
      cy.get('.folder-item__name').children('span').should('have.text', '日本行銷')
    })

    it('navigates to the corresponding view while its rows are clicked', () => {
      getSidebarRow('all').click()
      cy.get('.design-view').should('have.class', 'all-design-view')
      getSidebarRow('favorite').click()
      cy.get('.design-view').should('have.class', 'favorite-design-view')
      getSidebarFolder(0, 0).click()
      cy.get('.design-view').should('have.class', 'folder-design-view')
      cy.get('.folder-design-view__folder-name').should('have.text', 'Toby')
      getSidebarRow('trash').click()
      cy.get('.design-view').should('have.class', 'trash-design-view')
    })
  })

  describe('AllDesignView', () => {
    it('shows all designs', () => {
      getSidebarRow('all').click()
      for (let i = 0; i < 15; i++) {
        cy.contains(`Name${i + 1}`).should('exist')
      }
    })
  })

  describe('FavoriteDesignView', () => {
    beforeEach(() => {
      getSidebarRow('all').click()
      for (let i = 0; i < 3; i++) {
        cy.contains(`Name${i + 2}`).parents('.design-item')
          .children('.design-item__block')
          .children('.design-item__controller')
          .children('.design-item__controller-content')
          .children('.design-item__favorite')
          .click()
      }
      getSidebarRow('favorite').click()
    })

    it('shows favorite designs', () => {
      for (let i = 0; i < 3; i++) {
        cy.contains(`Name${i + 2}`).should('exist')
      }
    })

    it('has only "share", "download" and "delete" in design item menu', () => {
      cy.get('.design-item__block').eq(0).trigger('mouseenter')
      cy.get('.design-item__more').eq(0).click()
      const icons = ['#share-alt', '#download', '#trash']
      for (let i = 0; i < 3; i++) {
        cy.get('.design-menu-item__icon svg use').eq(i).should('have.attr', 'xlink:href').and('be.equal', icons[i])
      }
    })

    it('it has only "rmFav" and "delete" in multi-select menu', () => {
      cy.get('.design-item__block').eq(0).trigger('mouseenter')
      cy.get('.design-item__checkbox').eq(0).click()
      cy.get('.design-item__checkbox').eq(0).click()
      const icons = ['#heart', '#trash']
      for (let i = 0; i < 2; i++) {
        cy.get('.my-design__multi__icon svg use').eq(i).should('have.attr', 'xlink:href').and('be.equal', icons[i])
      }
      cy.get('.my-design__multi__icon').eq(1).trigger('mouseenter')
      cy.contains('刪除後會將原始檔案一併移除。').should('exist')
    })
  })
})