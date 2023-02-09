// Command that do image edit test

Cypress.Commands.add('imageAdjust', { prevSubject: 'element' }, (subject) => {
  function getOptions() {
    const options = [
      'brightness/50/0',
      'brightness/-50/0',
      'contrast/50/0',
      'contrast/-50/0',
      'saturate/50/0',
      'saturate/-50/0',
      'hue/50/0',
      'hue/-50/0',
      'blur/50/0',
      'blur/-50/0',
      'halation/75/0',
      'halation/25/0',
      'warm/50/0',
      'warm/-50/0'
    ]
    return options.map(option => {
      const match = option.match(/(\w+)\/([-\d]+)\/([-\d]+)/)
      return { name: match[1], val: match[2], init: match[3] }
    })
  }

  cy.wrap(subject).click()
    .get('.photo-setting .photo-setting__grid button').contains('調整').click()
    .then(() => {
      for (const option of getOptions()) {
        cy.get(`.photo-setting .popup-adjust input[type="range"][name="${option.name}"]`)
          .invoke('val', option.val).trigger('input').snapshotTest(`Adjust ${option.name} ${option.val}`)
          .get(`.photo-setting .popup-adjust input[type="range"][name="${option.name}"]`)
          .invoke('val', option.init).trigger('input')
      }
    })
  return cy.wrap(subject)
})

// export function flip() {
// }
// export function crop() {
// }
// export function shadow() {
// }
// export function align() {
// }
// export function setBg() {
// }
