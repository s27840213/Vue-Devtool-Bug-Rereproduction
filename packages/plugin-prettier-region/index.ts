const { parsers: typescriptParsers } = require('prettier/parser-typescript')
const { parsers: javascriptParsers } = require('prettier/parser-babel')
const S = require('subsecond')

function preprocess(text, opts) {
  S.load({ 'any.tsx': text })

  S().append('// its working!')

  return S.print()['any.tsx']
}


module.exports = {
  parsers: {
    typescript: {
      ...typescriptParsers.typescript,
      preprocess
    },
    babel: {
      ...javascriptParsers.babel,
      preprocess
    }
  }
}
