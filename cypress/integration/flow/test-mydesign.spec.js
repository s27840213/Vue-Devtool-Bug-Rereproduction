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
      cy.contains('新增資料夾').should('exist').and('have.class', 'nav-folder-0__text')
    })

    it('has draggble folder rows and moves them when dropping', () => {
      getSidebarFolder(0, 0).dragElementTo(() => getSidebarFolder(0, 2), () => getSidebarFolder(0, 0))
      toggleFolderExpansion(0)
      getSidebarFolder(1).contains('Toby')
    })
  })
})