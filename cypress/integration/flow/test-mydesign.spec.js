/*
** After design API is done, 
** add something to querystring for using testing folders 
** and designs instead of using user designs
*/

var toggleFolderExpansion = (level, nth = 0) => {
  cy.get(`.nav-folder-${level}`).eq(nth).children('.nav-folder__expand-icon-container').click()
}

var toggleStructureFolderExpansion = (level, nth = 0) => {
  cy.get(`.my-design__change-folder__folders .nav-folder-${level}`).eq(nth).children('.nav-folder__expand-icon-container').click()
}

var getSidebarFolder = (level, nth = undefined) => {
  let res = cy.get(`.nav-folder-${level}`)
  if (nth !== undefined) {
    res = res.eq(nth)
  }
  return res
}

var getStructureFolder = (level, nth = undefined) => {
  let res = cy.get(`.my-design__change-folder__folders .nav-folder-${level}`)
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

describe.skip('MyDesign', () => {
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

    it('has only "rmFav" and "delete" in multi-select menu', () => {
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

  describe('FolderDesignView', () => {
    it('shows the current folder name which is editable', () => {
      getSidebarFolder(0, 0).click()
      cy.get('.folder-design-view__folder-name span button span').should('have.text', 'Toby')
      cy.get('.folder-design-view__folder-name span button').click()
      cy.get('.folder-design-view__folder-name span div input')
        .type('{selectall}{backspace}AnotherFolderName{enter}')
      cy.get('.folder-design-view__folder-name span button').click()
      cy.get('.folder-design-view__folder-name span div input')
        .type('{selectall}{backspace}01234567891123456789212345678931234567894123456789512345678912345')
      cy.contains('不可超過64個字元，請縮減名稱。').should('exist')
      cy.get('.folder-design-view__folder-name span div input')
        .type('{enter}')
      cy.get('.folder-design-view__folder-name span button span').should('have.text', '0123456789112345678921234567893123456789412345678951234567891234')
    })

    it('shows all the path from ROOT whose nodes navigate to corresponding folder', () => {
      for (let i = 0; i < 5; i++) {
        toggleFolderExpansion(i)
      }
      getSidebarFolder(4).click()
      const pathText = 'Toby 素材2 材質3 材質4 材質5'
      cy.get('.folder-design-view__path__node').should('have.text', pathText)
      const parentIndex = Math.floor(Math.random() * 4)
      cy.get('.folder-design-view__path__node').eq(parentIndex).click()
      cy.get('.folder-design-view__folder-name span button span').should('have.text', pathText.split(' ')[parentIndex])
    })

    it('enters folder name editting when more/rename is pressed', () => {
      getSidebarFolder(0, 0).click()
      cy.get('.folder-design-view__more').click()
      cy.get('.folder-design-view__more__menu__actions > div').eq(0).click()
      cy.get('.folder-design-view__folder-name span div input').should('exist')
    })

    it('shows warning message before deleting current folder or just deletes it when it\'s empty and navigates to parent folder', () => {
      getSidebarFolder(0, 0).click()
      cy.get('.folder-design-view__more').click()
      cy.get('.folder-design-view__more__menu__actions > div').eq(1).click()
      cy.get('.delete-folder-message').should('exist')
      cy.get('.delete-folder-message__cancel').click()
      cy.get('.folder-design-view__more').click()
      cy.get('.folder-design-view__more__menu__actions > div').eq(1).click()
      cy.get('.delete-folder-message__confirm').click()
      getSidebarFolder(0, 0).click()
      cy.get('.folder-design-view__more').click()
      cy.get('.folder-design-view__more__menu__actions > div').eq(1).click()
      cy.contains('已移至垃圾桶').should('exist')
      cy.get('.my-design__message__button').click()
      cy.contains('日本行銷').should('exist')
    })

    it('creates a new folder when New Folder buttion is pressed', () => {
      getSidebarFolder(0, 0).click()
      cy.get('.folder-design-view__new-folder').click()
      cy.contains('未命名資料夾').should('exist')
    })

    it('changes sorting method when some sorting criterium is selected and shows check icon on selected criterium', () => {
      getSidebarFolder(0, 0).click()
      cy.get('.folder-design-view__sort-by').click()
      cy.contains('名稱 ( 遞減 )').click()
      const oneDigitNames = []
      for (let i = 0; i < 8; i++) {
        oneDigitNames.push(`Name${9 - i}`)
      }
      const twoDigitNames = []
      for (let i = 0; i < 6; i++) {
        twoDigitNames.push(`Name1${5 - i}`)
      }
      cy.get('.design-item__name__container').should('have.text', oneDigitNames.join('') + twoDigitNames.join('') + 'Name1')
      cy.get('.sort-menu-right').parent().should('have.text', '名稱 ( 遞減 )')
    })
  })

  describe('TrashDesignView', () => {
    beforeEach(() => {
      getSidebarRow('all').click()
      for(let i = 0; i < 3; i++) {
        cy.get('.design-item__block').eq(0).trigger('mouseenter')
        cy.get('.design-item__more').eq(0).click()
        cy.contains('刪除').click()
      }
      getSidebarRow('trash').click()
    })

    it('shows information while info icon is pressed', () => {
      cy.get('.trash-design-view__info').click()
      cy.contains('30天後自動永久刪除。').should('exist')
    })

    it('has only "recover" and "delete-forever" in design item menu', () => {
      cy.get('.design-item__block').eq(0).trigger('mouseenter')
      cy.get('.design-item__more').eq(0).click()
      const icons = ['#reduction', '#trash']
      for (let i = 0; i < 2; i++) {
        cy.get('.design-menu-item__icon svg use').eq(i).should('have.attr', 'xlink:href').and('be.equal', icons[i])
      }
    })

    it('has only "recover" and "delete-forever" in multi-select menu', () => {
      cy.get('.design-item__block').eq(0).trigger('mouseenter')
      cy.get('.design-item__checkbox').eq(0).click()
      cy.get('.design-item__checkbox').eq(0).click()
      const icons = ['#reduction', '#trash']
      for (let i = 0; i < 2; i++) {
        cy.get('.my-design__multi__icon svg use').eq(i).should('have.attr', 'xlink:href').and('be.equal', icons[i])
      }
    })
  })

  describe('FolderItem', () => {
    it('is draggable and moves itself to dropped target (sidebar folder or folder item)', () => {
      for (let i = 0; i < 2; i++) {
        toggleFolderExpansion(i)
      }
      getSidebarFolder(2, 0).click('right')
      cy.get('.folder-design-view__new-folder').click()
      cy.get('.folder-design-view').click()
      cy.get('.folder-item__block').eq(0).dragElementTo(
        () => cy.get('.folder-item__block').eq(1),
        () => cy.get('.folder-item__block').eq(0)
      )
      cy.contains('已移至').should('exist')
      cy.wait(3000)
      cy.get('.folder-item__block').eq(0).click()
      cy.contains('未命名資料夾').should('exist')
      cy.get('.folder-item__block').eq(0).dragElementTo(
        () => getSidebarFolder(0, 0),
        () => cy.get('.folder-item__block').eq(0)
      )
      cy.contains('已移至').should('exist')
      toggleFolderExpansion(0, 0)
      getSidebarFolder(0, 0).click()
      cy.contains('未命名資料夾').should('exist')
      cy.get('.folder-item__block').eq(0).dragElementTo(
        () => getSidebarRow('trash'),
        () => cy.get('.folder-item__block').eq(0)
      )
      cy.contains('已移至垃圾桶').should('exist')
      getSidebarRow('trash').click()
      cy.contains('未命名資料夾').should('exist')
    })

    it('is not selectable', () => {
      getSidebarFolder(0, 0).click()
      cy.get('.folder-item__checkbox').should('not.exist')
    })

    it('is selectable in trash-design-view', () => {
      getSidebarFolder(0, 0).click()
      for (let i = 0; i < 3; i++) {
        cy.get('.folder-design-view__new-folder').click()
      }
      cy.get('.folder-design-view').click()
      for (let i = 0; i < 3; i++) {
        cy.get('.folder-item__block').eq(0).dragElementTo(
          () => getSidebarRow('trash'),
          () => cy.get('.folder-item__block').eq(0)
        )
      }
      getSidebarRow('trash').click()
      cy.get('.folder-item__block').eq(0).trigger('mouseenter')
      cy.get('.folder-item__checkbox').eq(0).click()
      cy.get('.folder-item__checkbox').eq(0).should('exist')
      cy.get('.folder-item__checkbox').eq(0).click()
      cy.get('.my-design__multi').should('exist')
      cy.get('.folder-item__checkbox-checked').eq(0).click()
      cy.get('.folder-item__checkbox-checked').eq(0).click()
      cy.get('.folder-item__checkbox-checked').should('not.exist')
    })

    it('is not draggable in trash-design-view', () => {
      getSidebarFolder(0, 0).click()
      cy.get('.folder-design-view__new-folder').click()
      cy.get('.folder-design-view').click()
      cy.get('.folder-item__block').eq(0).dragElementTo(
        () => getSidebarRow('trash'),
        () => cy.get('.folder-item__block').eq(0)
      )
      getSidebarRow('trash').click()
      cy.get('.folder-item__block').should('has.attr', 'draggable').and('be.equal', 'false')
    })
  })

  describe('DesignItem', () => {
    it('is draggable and moves itself to dropped target (sidebar folder or folder item)', () => {
      getSidebarFolder(0, 0).click()
      cy.get('.design-item__block').eq(0).dragElementTo(
        () => cy.get('.folder-item__block').eq(0),
        () => cy.get('.design-item__block').eq(0)
      )
      cy.contains('已移至').should('exist')
      cy.wait(3000)
      cy.get('.folder-item__block').eq(0).click()
      cy.contains('Name1').should('exist')
      cy.get('.design-item__block').eq(0).dragElementTo(
        () => getSidebarFolder(0, 0)
      )
      cy.contains('已移至').should('exist')
      getSidebarFolder(0, 0).click()
      cy.contains('Name1').should('exist')
      cy.get('.design-item__block').eq(0).dragElementTo(
        () => getSidebarRow('trash'),
        () => cy.get('.design-item__block').eq(0)
      )
      cy.contains('已移至垃圾桶').should('exist')
      getSidebarRow('trash').click()
      cy.contains('Name1').should('exist')
    })

    it('toggles favorite when heart icon is pressed', () => {
      cy.get('.design-item__favorite:nth(0) > svg > use').should('not.exist')
      cy.get('.design-item__favorite').eq(0).click()
      cy.get('.design-item__favorite:nth(0) > svg > use').should('have.attr', 'xlink:href').and('be.equal', '#favorites-fill')
      cy.get('.design-item__favorite').eq(0).click()
      cy.get('.design-item__favorite:nth(0) > svg > use').should('have.attr', 'xlink:href').and('be.equal', '#favorites')
    })

    it('creates duplicate when copy icon is pressed', () => {
      cy.get('.design-item__block').eq(0).trigger('mouseenter')
      cy.get('.design-item__more').eq(0).click()
      cy.contains('建立副本').click()
      cy.contains('的副本').should('exist')
    })

    it('deletes itself when trash icon is pressed and shows delete message', () => {
      cy.get('.design-item__block').eq(0).trigger('mouseenter')
      cy.get('.design-item__more').eq(0).click()
      cy.contains('刪除').click()
      cy.contains('已移至垃圾桶').should('exist')
      getSidebarRow('trash').click()
      cy.get('.design-item').should('exist')
    })

    it('recovers itself when reduction icon is pressed and shows recover message', () => {
      cy.get('.design-item__block').eq(0).trigger('mouseenter')
      cy.get('.design-item__more').eq(0).click()
      cy.contains('刪除').click()
      getSidebarRow('trash').click()
      cy.get('.design-item__block').eq(0).trigger('mouseenter')
      cy.get('.design-item__more').eq(0).click()
      cy.contains('還原').click()
      cy.contains('已移至垃圾桶').should('exist')
      cy.contains('已移至').should('exist')
    })

    it('shows delete forever message when trash icon is pressed (in trash design view)', () => {
      cy.get('.design-item__block').eq(0).trigger('mouseenter')
      cy.get('.design-item__more').eq(0).click()
      cy.contains('刪除').click()
      getSidebarRow('trash').click()
      cy.get('.design-item__block').eq(0).trigger('mouseenter')
      cy.get('.design-item__more').eq(0).click()
      cy.contains('永久刪除').click()
      cy.get('.delete-forever-message').should('exist')
      cy.get('.delete-forever-message__confirm').click()
      cy.get('.design-item').should('not.exist')
    })

    it('is selectable', () => {
      cy.get('.design-item__block').eq(0).trigger('mouseenter')
      cy.get('.design-item__checkbox').eq(0).click()
      cy.get('.design-item__checkbox').eq(0).should('exist')
      cy.get('.design-item__checkbox').eq(0).click()
      cy.get('.my-design__multi').should('exist')
      cy.get('.design-item__checkbox-checked').eq(0).click()
      cy.get('.design-item__checkbox-checked').eq(0).click()
      cy.get('.design-item__checkbox-checked').should('not.exist')
    })
  })

  describe('MultiMenu', () => {
    beforeEach(() => {
      cy.get('.design-item__block').eq(0).trigger('mouseenter')
      cy.get('.design-item__checkbox').eq(0).click()
      cy.get('.design-item__checkbox').eq(0).click()
    })

    it('adds all selected design items to favorite when heart icon is pressed', () => {
      cy.get('.my-design__multi__actions > div').eq(0).click()
      cy.get('.design-item__favorite:nth(0) > svg > use').should('have.attr', 'xlink:href').and('be.equal', '#favorites-fill')
      cy.get('.design-item__favorite:nth(1) > svg > use').should('have.attr', 'xlink:href').and('be.equal', '#favorites-fill')
    })

    it('deletes all selected design items when trash icon is pressed (shows confirm message)', () => {
      cy.get('.my-design__multi__actions > div').eq(2).click()
      cy.contains('確定要刪除這些設計？').should('exist')
    })

    it('removes all selected design items from favorite when heart icon is pressed when in favorite design view', () => {
      cy.get('.my-design__multi__actions > div').eq(0).click()
      getSidebarRow('favorite').click()
      cy.get('.design-item__block').eq(0).trigger('mouseenter')
      cy.get('.design-item__checkbox').eq(0).click()
      cy.get('.design-item__checkbox').eq(0).click()
      cy.get('.my-design__multi__actions > div').eq(0).click()
      cy.get('.design-item').should('not.exist')
    })

    it('recovers all selected design items when reduction icon is pressed', () => {
      cy.get('.my-design__multi__actions > div').eq(2).click()
      cy.get('.delete-all-message__confirm').click()
      getSidebarRow('trash').click()
      cy.get('.design-item__block').eq(0).trigger('mouseenter')
      cy.get('.design-item__checkbox').eq(0).click()
      cy.get('.design-item__checkbox').eq(0).click()
      cy.get('.my-design__multi__actions > div').eq(0).click()
      cy.contains('已移至').should('exist')
      cy.contains('原資料夾').should('exist')
    })

    it('deletes all selected design items forever when trash icon is pressed (shows confirm message)', () => {
      cy.get('.my-design__multi__actions > div').eq(2).click()
      cy.get('.delete-all-message__confirm').click()
      getSidebarRow('trash').click()
      cy.get('.design-item__block').eq(0).trigger('mouseenter')
      cy.get('.design-item__checkbox').eq(0).click()
      cy.get('.design-item__checkbox').eq(0).click()
      cy.get('.my-design__multi__actions > div').eq(1).click()
      cy.get('.delete-forever-message').should('exist')
      cy.get('.delete-forever-message__confirm').click()
      cy.get('.design-item').should('not.exist')
    })

    it('is shown when a folder item and a design item are selected in trash design view', () => {
      cy.get('.my-design__multi__actions > div').eq(2).click()
      cy.get('.delete-all-message__confirm').click()
      getSidebarFolder(0, 2).dragElementTo(() => getSidebarRow('trash'))
      getSidebarRow('trash').click()
      cy.get('.design-item__block').eq(0).trigger('mouseenter')
      cy.get('.design-item__checkbox').eq(0).click()
      cy.get('.folder-item__block').eq(0).trigger('mouseenter')
      cy.get('.folder-item__checkbox').eq(0).click()
      cy.get('.my-design__multi').should('exist')
    })
  })

  describe('ChangeFolderMenu', () => {
    it('is shown when folder icon in design-item menu is pressed', () => {
      cy.get('.design-item__block').eq(0).trigger('mouseenter')
      cy.get('.design-item__more').eq(0).click()
      cy.contains('移至資料夾').click()
      cy.get('.my-design__change-folder').should('exist')
    })

    it('is shown when folder icon in multi-select menu is pressed', () => {
      cy.get('.design-item__block').eq(0).trigger('mouseenter')
      cy.get('.design-item__checkbox').eq(0).click()
      cy.get('.design-item__checkbox').eq(0).click()
      cy.get('.my-design__multi__actions > div').eq(1).click()
      cy.get('.my-design__change-folder').should('exist')
    })

    it('shows folder structure', () => {
      cy.get('.design-item__block').eq(0).trigger('mouseenter')
      cy.get('.design-item__more').eq(0).click()
      cy.contains('移至資料夾').click()
      getStructureFolder(0, 0).should('have.text', 'Toby')
      getStructureFolder(0, 1).should('have.text', '日本行銷')
      getStructureFolder(1).should('not.exist')
      toggleStructureFolderExpansion(0)
      getStructureFolder(1).should('have.text', '素材2')
      for (let i = 0; i < 4; i++) {
        toggleStructureFolderExpansion(i + 1)
      }
      getStructureFolder(4).should('have.text', '材質5')
      toggleStructureFolderExpansion(0)
      getStructureFolder(4).should('not.exist')
      toggleStructureFolderExpansion(0)
      getStructureFolder(4).should('have.text', '材質5')
    })

    it('moves design(s) to selected folder', () => {
      cy.get('.design-item__block').eq(0).trigger('mouseenter')
      cy.get('.design-item__more').eq(0).click()
      cy.contains('移至資料夾').click()
      getStructureFolder(0, 1).click()
      cy.get('.my-design__change-folder__confirm').click()
      getSidebarFolder(0, 2).click()
      cy.get('.design-item').should('exist')
      getSidebarRow('all').click()
      cy.get('.design-item__block').eq(1).trigger('mouseenter')
      cy.get('.design-item__checkbox').eq(0).click()
      cy.get('.design-item__checkbox').eq(1).click()
      cy.get('.my-design__multi__actions > div').eq(1).click()
      getStructureFolder(0, 1).click()
      cy.get('.my-design__change-folder__confirm').click()
      getSidebarFolder(0, 2).click()
      cy.get('.design-item').eq(1).should('exist')
      cy.get('.design-item').eq(2).should('exist')
    })
  })

  describe('ExtraRules', () => {
    it('limits moving a folder to its children or grand children folders (including itself)', () => {
      toggleFolderExpansion(0)
      getSidebarFolder(0, 0).dragElementTo(
        () => getSidebarFolder(1),
        () => getSidebarFolder(0, 0)
      )
      cy.contains('已移至').should('not.exist')
    })

    it('limits moving a folder to a max-level folder', () => {
      for (let i = 0; i < 4; i++) {
        toggleFolderExpansion(i)
      }
      cy.contains('日本行銷').parent('.nav-folder-0').dragElementTo(
        () => getSidebarFolder(4),
        () => cy.contains('日本行銷').parent('.nav-folder-0')
      )
      cy.contains('日本行銷').parent('.nav-folder-0').should('exist')
      getSidebarFolder(3).click(50, 0)
      cy.contains('日本行銷').parent('.nav-folder-0').dragElementTo(
        () => cy.get('.folder-item__block').eq(0),
        () => cy.contains('日本行銷').parent('.nav-folder-0')
      )
      cy.contains('日本行銷').parent('.nav-folder-0').should('exist')
    })

    it('limits creating new folders in a max-level folder', () => {
      for (let i = 0; i < 4; i++) {
        toggleFolderExpansion(i)
      }
      getSidebarFolder(4).click(50, 0)
      cy.get('.folder-design-view__new-folder').should('have.css', 'pointer-events').and('be.equal', 'none')
    })
  })
})