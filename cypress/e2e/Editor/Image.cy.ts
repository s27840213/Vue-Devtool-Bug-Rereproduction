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

  // it.only('Auto BG remove', function () {
  //   cy.visit('/editor')
  //     .importDesign('flower.json')
  //     .get('.nu-layer .nu-image img')
  //     .get('.nu-image')
  //     .imageAutoBgRemove().snapshotTest('init')
  //     // .imageAdjust()
  //     // .layerFlip()
  //     // .imageCrop('button')
  //     // .imageCrop('dblclick')
  //     // .imageShadow()
  //     // .layerAlign()
  //     // .imageSetAsBg()
  // })
  // it('Manually BG remove', function () {
  //   //
  // })

  it('Other image test', function() {
    cy.visit('/editor')
      .importDesign('2flower.json')
      .get('.nu-layer .nu-image img').snapshotTest('init')
      .get('.nu-layer__wrapper:nth-child(2) .nu-image').then((flowerBack) => {
        cy.get('.nu-layer__wrapper:nth-child(3) .nu-image')
          .layerOrder(flowerBack)
          // .layerCopy()
          // .deselectAllLayers().snapshotTest('init') // Check if image restore to init
      })
  })
})
