describe('Testing nu-image edit', () => {
  beforeEach(() => {
    cy.login()
  })

  it('Unsplash image', function () {
    cy.visit('/editor')
      .importDesign('flower.json')
      .get('.nu-layer .nu-image img').snapshotTest('init')
      .get('.nu-image')
      .imageAdjust()
      .layerFlip()
      .imageCrop('button')
      .imageCrop('dblclick')
      .imageShadow()
      .layerAlign()
      .imageSetAsBg()
      // TODO: Find reason why image mismatch after imageSetAsBg
      // .deselectAllLayers().snapshotTest('init').get('.nu-image') // Check if image restore to init
  })
  // it('Auto BG remove', function () {
  //   //
  // })
  // it('Manually BG remove', function () {
  //   //
  // })
})
