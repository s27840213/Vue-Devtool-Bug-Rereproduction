describe('Testing nu-image edit', () => {
  beforeEach(() => {
    cy.login()
  })

  it('Unsplash image', function () {
    cy.visit('/editor')
    cy.importDesign('flower.json')
    cy.get('.nu-layer .nu-image img').snapshotTest('init')
    cy.get('.nu-image')
      .imageAdjust()
      .layerFlip()
      .imageCrop('button')
      .imageCrop('dblclick')
      .imageShadow()
      .then((prev) => {
        console.log('end prev', prev)
      })
  })
  // it('Auto BG remove', function () {
  //   //
  // })
  // it('Manually BG remove', function () {
  //   //
  // })
})
