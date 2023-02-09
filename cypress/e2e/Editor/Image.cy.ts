// import { layerOrder, duplicate, lock, del, copyFormat } from '../common/LayerEdit'

describe('Testing nu-image edit', () => {
  beforeEach(() => {
    cy.login()
  })

  it('Test', () => {
    cy.visit('/editor')
    cy.importDesign('flower.json')
    cy.get('.nu-layer .nu-image img').snapshotTest('success')
    cy.get('.nu-layer .nu-image img').snapshotTest('fail')
  })
  // it('Test for unsplash image', function () {
  //   //
  // })
  // it('Test for auto BG remove', function () {
  //   //
  // })
  // it('Test for manually BG remove', function () {
  //   //
  // })
})
