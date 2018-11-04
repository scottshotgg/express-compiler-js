const fs = require('fs')
const util = require('util')

const lexer = require('./lexer.js')
const parser = require('./parser.js')

const argv = require('yargs').argv

// Grab the filename from the first arg and fallback to the arg
const TEST_PATH = argv['_'][0] || argv['path']
if (!TEST_PATH) {
  console.log('You must specify a test path using the `--path` argument')
  process.exit(9)
}

if (!fs.existsSync(TEST_PATH)) {
  console.log('Supplied path is not a valid path: ' + TEST_PATH)
  process.exit(9)
}

var results = {
  passed: 0,
  failed: 0,
  untestable: 0,
  total: 0,
}

function testDir(path) {
  const dir = fs.readdirSync(path)

  for (d of dir) {
    if (d != "_") {
      const localPath = path + '/' + d
      if (fs.statSync(localPath).isFile()) {
        if (localPath.split('.').length < 3) {
          console.log()
          // console.log('Testing: \x1b[47m\x1b[30m%s\x1b[0m', localPath)
          console.log('Testing: ' + localPath)
          results.total += 2

          const filedata = fs.readFileSync(localPath).toString()
          if (filedata === undefined) {
            results.untestable++
            console.log(localPath + "did not contain any data")
            continue
          }

          const tokens = new lexer(filedata).lex(filedata)
          // check tokens file
          const tokenFile = localPath + '.tokens.json'
          var currentFile = fs.readFileSync(tokenFile)
          if (currentFile === undefined) {
            console.log(tokenFile + ' was empty! Writing file ...')
            results.untestable++
            fs.writeFileSync(tokenFile, JSON.stringify(tokens, null, 2))
            continue
          }

          if (currentFile != JSON.stringify(tokens, null, 2)) {
            console.log('tokens: \x1b[31m%s\x1b[0m', 'failed ✗')
            results.failed++
          } else {
            console.log('tokens: \x1b[32m%s\x1b[0m', 'passed ✓')
            results.passed++
          }

          const ast = new parser(tokens).buildAST()
          // check the ast file
          const astFile = localPath + '.ast.json'
          var currentFile = fs.readFileSync(astFile)
          if (currentFile === undefined) {
            console.log(astFile + ' was empty! Writing file ...')
            results.untestable++
            fs.writeFileSync(astFile, JSON.stringify(ast, null, 2))
            continue
          }

          if (currentFile != JSON.stringify(ast, null, 2)) {
            console.log('ast:    \x1b[31m%s\x1b[0m', 'failed ✗')
            results.failed++
          } else {
            console.log('ast:    \x1b[32m%s\x1b[0m', 'passed ✓')
            results.passed++
          }
        }
      } else {
        testDir(localPath)
      }
    }
  }
}

console.log('Using tests from: \x1b[47m\x1b[30m%s\x1b[0m', TEST_PATH)
testDir(TEST_PATH)
console.log()
console.log('Results: ' + util.inspect(results, { depth: null, colors: true }))