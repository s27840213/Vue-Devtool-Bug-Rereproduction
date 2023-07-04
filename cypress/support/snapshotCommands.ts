import { recurse } from 'cypress-recurse'

const snapshotStyles = `
  /* Hide carets */
  * { caret-color: transparent !important; }

  /* Generic hide */
  [cy-visual-test="transparent"] {
    color: transparent !important;
    font-family: monospace !important;
    opacity: 0 !important;
  }

  [cy-visual-test="removed"] {
    display: none !important;
  }

  [cy-test-no-radius] {
    border-radius: 0 !important;
  }
  /* Hide controller and page border */
  .nu-page .page-highlighter {
    outline: none;
  }
  .nu-layer {
    will-change: auto !important;
  }
  .page-control {
    display: none;
  }
`
Cypress.Commands.add('disableTransition', () => {
  // Disable all animation for more stable snapshot result, https://glebbahmutov.com/blog/css-animations/
  cy.get('body').invoke('append', Cypress.$(`
    <style id="my-animation-disabler">
    *, *:before, *:after {
      transition-property: none !important;
      animation: none !important;
    }
    </style>
  `))
})

// Modified from 'cypress-image-diff-js' command: compareSnapshot
const compareSnapshotCommand = defaultScreenshotOptions => {
  Cypress.Commands.add('myCompareSnapshot', { prevSubject: 'optional' },
    (subject: JQuery<HTMLElement>, imgName, _logName, testThreshold = 0, recurseOptions = {}) => {
      const specName = Cypress.spec.name
      // Modified: use / instead of -
      const testName = `${specName.replace('.js', '')}/${imgName}`
      // Modified: Add logName
      const logName = `${specName.replace('.js', '')}/${_logName}`

      const defaultRecurseOptions = {
        limit: 1,
        log: (percentage) => {
          const prefix = percentage <= testThreshold ? 'PASS' : 'FAIL'
          // Modified: add logName.png to log
          cy.log(`${prefix}: Image '${logName}.png' difference percentage ${percentage}`)
        },
        // Modified: add logName.png to error
        error: `Image '${logName}.png' difference greater than threshold: ${testThreshold}`
      }

      recurse(
        () => {
          // Clear the comparison/diff screenshots/reports for this test
          // Modified: add {log: false} to tasks
          cy.task('deleteScreenshot', { testName }, { log: false })
          cy.task('deleteReport', { testName }, { log: false })

          // Take a screenshot and copy to baseline if it does not exist
          const objToOperateOn = subject ? cy.wrap(subject, { log: false }) : cy
          objToOperateOn
            .screenshot(testName, defaultScreenshotOptions)
            .task('copyScreenshot', { testName }, { log: false })

          // Compare screenshots
          const options = {
            testName,
            testThreshold,
          }

          return cy.task('compareSnapshotsPlugin', options, { log: false })
        },
        (percentage) => percentage <= testThreshold,
        Object.assign({}, defaultRecurseOptions, recurseOptions)
      )
    }
  )
}
compareSnapshotCommand({ disableTimersAndAnimations: false, log: false })

Cypress.Commands.add('snapshotTest', { prevSubject: 'optional' }, (subject: JQuery<unknown>, testName: string, { toggleMobilePanel = '', pageIndex = 0 } = {}) => {
  // TODO: Need to find a way that keep 0.01 threshold and prevent command fail
  // Workaround is set threshold to 100% to prevent fail, but it will not create diff image
  // TODO: Investigation why compareSnapshot fail and other image that not take snapshot still appear in report
  // This will happend if using on('fail') to force image mismatch test pass when 'cy open' mode

  const generateBaseline = Cypress.env('generateBaseline') === true
  const threshold = Cypress.browser.isHeadless && !generateBaseline ? 0.01 : 1
  const logName = `${Cypress.currentTest.title}/${testName}`
  let imageName = `${Cypress.currentTest.title}/${testName}`
  // For BG Remove test, use original test title to verify
  imageName = imageName.replace('Auto BG remove/', 'Unsplash image/')

  cy.get('#app', { log: false })
    .invoke({ log: false }, 'prop', '__vue_app__')
    .its('config.globalProperties.$isTouchDevice', { log: false })
    .then((isMobile: () => boolean) => {
      // If toggleMobilePanel given, close mobile panel before snapshot and re-open the panel.
      if (isMobile() && toggleMobilePanel) {
        cy.togglePanel(toggleMobilePanel)
      }

      cy.document({ log: false }).then((document) => {
        // Add special css that hide/remove some element during snapshot.
        const css = document.createElement('style')
        css.setAttribute('class', 'cy-visual-test-style')
        css.textContent = snapshotStyles
        document.body.appendChild(css)
      }).then(() => { if (generateBaseline) cy.wait(5000) }) // Wait 10s for generate baseline
        .get(`#nu-page_${pageIndex}`)
        .myCompareSnapshot(imageName, logName, threshold, { limit: 3, delay: 1000 })
        // Remove special css
        .get('style.cy-visual-test-style', { log: false })
        .invoke({ log: false }, 'remove')

      // Re-open the panel
      if (isMobile() && toggleMobilePanel) {
        cy.togglePanel(toggleMobilePanel)
      }
      if (subject && subject.length) return cy.wrap(subject, { log: false })
    })
})
