const fs = require('fs')
const util = require('util')

const lexer = require('./lexer.js')
const parser = require('./parser.js')

const argv = require('yargs').argv

// Grab the filename from the first arg and fallback to the arg
const filename = argv['_'][0] || argv['path']
if (!filename) {
  console.log('You must specify a file to compile using the `--path` argument')
  return
}

const filedata = fs.readFileSync(filename).toString()
if (argv['debug']) {
  console.log(filedata, '\n\n')
}

const tokens = new lexer(filedata).lex(filedata)
if (argv['debug']) {
  console.log(tokens)
  console.log('\n')
}

const ast = new parser(tokens).buildAST()
if (argv['debug']) {
  console.log(util.inspect(ast, { depth: null, colors: true }));
}