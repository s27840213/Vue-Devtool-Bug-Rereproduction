for (const isMobile of [true, false]) {
  // if (!isMobile) continue
  const suffix = isMobile ? ' mobile' : ''

  describe('Testing nu-image edit', () => {
    beforeEach(() => {
      cy.login()

      if (!isMobile) return
      // Mobile only
      cy.viewport(390, 844)
      window.localStorage.setItem('not-mobile', 'true')
      cy.on('window:before:load', (win) => {
        Object.defineProperty(win.navigator, 'userAgent', {
          value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 11_0 like Mac OS X) AppleWebKit/604.1.38 (KHTML, like Gecko) Version/11.0 Mobile/15A372 Safari/604.1',
        })
      })
    })

    it(`Unsplash image${suffix}`, function () {
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

    // it(`Other image test${suffix}`, function() {
    //   function beforeCopyFormat () {
    //     cy.get('.photo-setting .photo-setting__grid button').contains('調整').click()
    //       .get('.photo-setting .popup-adjust input[type="range"][name="brightness"]')
    //       .invoke('val', 50).trigger('input')
    //       .get('.photo-setting .popup-adjust input[type="range"][name="contrast"]')
    //       .invoke('val', 50).trigger('input')
    //   }
    //   function afterCopyFormat () {
    //     cy.get('.photo-setting .photo-setting__grid button').contains('調整').click()
    //       .get('.photo-setting .popup-adjust input[type="range"][name="brightness"]')
    //       .invoke('val', 0).trigger('input')
    //       .get('.photo-setting .popup-adjust input[type="range"][name="contrast"]')
    //       .invoke('val', 0).trigger('input')
    //   }

    //   cy.visit('/editor')
    //     .importDesign('2flower.json')
    //     .get('.nu-layer .nu-image img').snapshotTest('init')
    //     .get('.nu-layer__wrapper:nth-child(2) .nu-image').then((flowerBack) => {
    //       cy.get('.nu-layer__wrapper:nth-child(3) .nu-image')
    //         .layerOrder(flowerBack)
    //         .layerCopy()
    //         .layerLock()
    //         .layerDelete()
    //         .layerCopyFormat(flowerBack, beforeCopyFormat, afterCopyFormat)
    //         .deselectAllLayers().snapshotTest('init') // Check if image restore to init
    //     })
    // })
  })
}
