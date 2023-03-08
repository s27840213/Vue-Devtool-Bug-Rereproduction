for (const isMobile of [true, false]) {
  // if (isMobile) continue
  // if (!isMobile) continue
  const suffix = isMobile ? ' mobile' : ''

  describe(`Testing nu-image${suffix} edit`, () => {
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
        .disableTransition()
        .importDesign('flower.json')
        .get('.nu-layer .nu-image img').and(($img: JQuery<HTMLImageElement>) => {
          // "naturalWidth" and "naturalHeight" are set when the image loads
          expect($img[0].naturalWidth).to.be.greaterThan(0)
        }).snapshotTest('init')
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

    if (!isMobile) {
      it(`Auto BG remove${suffix}`, function () {
        cy.visit('/editor')
          .disableTransition()
          .importDesign('flower.json')
          .get('.nu-image')
          .imageAutoBgRemove()
          .deselectAllLayers()
          .snapshotTest('init')
          .get('.nu-image')
          .imageAdjust()
          .layerFlip()
          .imageCrop('button')
          .imageCrop('dblclick')
          .imageShadow()
          .layerAlign()
          .imageSetAsBg()
      })
      it('Manually BG remove', function () {
        cy.visit('/editor')
          .disableTransition()
          .importDesign('flower.json')
          .get('.nu-image')
          .imageManuallyBgRemove()
          .deselectAllLayers()
          .snapshotTest('init')
          .get('.nu-image')
          .imageAdjust()
          .layerFlip()
          .imageCrop('button')
          .imageCrop('dblclick')
          .imageShadow()
          .layerAlign()
          .imageSetAsBg()
      })
    }

    it(`Other image test${suffix}`, function () {
      function beforeCopyFormat() {
        cy.togglePanel('調整')
          .get('input[type="range"][name="brightness"]').eq(-1)
          .invoke('val', 50).trigger('input')
          .get('input[type="range"][name="contrast"]').eq(-1)
          .invoke('val', 50).trigger('input')
          .togglePanel('調整')
      }
      function afterCopyFormat() {
        cy.togglePanel('調整')
        cy.contains('重置效果').click()
          .togglePanel('調整')
      }

      cy.visit('/editor')
        .disableTransition()
        .importDesign('2flower.json')
        .get('.nu-layer .nu-image img').and(($img: JQuery<HTMLImageElement>) => {
          // "naturalWidth" and "naturalHeight" are set when the image loads
          expect($img[0].naturalWidth).to.be.greaterThan(0)
          expect($img[1].naturalWidth).to.be.greaterThan(0)
        })
        .snapshotTest('init')
        .get('.nu-layer__wrapper:nth-child(2) .nu-image').then((flowerBack) => {
          cy.get('.nu-layer__wrapper:nth-child(3) .nu-image')
            .layerOrder(flowerBack)
            .layerCopy()
            .layerLock()
            .layerDelete()
            .layerCopyFormat(flowerBack, beforeCopyFormat, afterCopyFormat)
            .then((subject: JQuery<HTMLElement>) => {
              // TODO: Implement layer copy format in mobile
              if (isMobile) return cy.wrap(subject)
              return cy.wrap(subject)
                .layerMoveToPage2()
            })
          // .deselectAllLayers().snapshotTest('init') // Check if image restore to init
        })
    })
  })
}
