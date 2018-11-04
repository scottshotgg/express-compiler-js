const fs = require('fs')
const util = require('util')

const lexer = require('./lexer.js')
const parser = require('./parser.js')

const argv = require('yargs').argv
var colors = require('colors');

colors.setTheme({
  silly: 'rainbow',
  input: 'grey',
  verbose: 'cyan',
  prompt: 'grey',
  info: 'green',
  data: 'grey',
  help: 'cyan',
  warn: 'yellow',
  debug: 'blue',
  error: 'red'
});

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
  files: {}
}

function testDir(path) {
  const dir = fs.readdirSync(path)

  dir.map((d) => {
    if (d != "_") {
      const localPath = path + '/' + d
      if (fs.statSync(localPath).isFile()) {
        if (localPath.split('.').length < 3) {
          // console.log('Testing: \x1b[47m\x1b[30m%s\x1b[0m', localPath)
          results.total += 2
          results.files[localPath] = {}

          const filedata = fs.readFileSync(localPath).toString()
          if (filedata === undefined) {
            console.log(localPath + "did not contain any data")
            results.files[localPath] = undefined
            results.untestable++
            return
          }

          const tokens = new lexer(filedata).lex(filedata)
          // check tokens file
          const tokenFile = localPath + '.tokens.json'
          var currentFile = fs.readFileSync(tokenFile)
          if (currentFile === undefined) {
            console.log(tokenFile + ' was empty! Writing file ...')
            results.files[localPath]['tokens'] = 'untestable'
            results.untestable++
            fs.writeFileSync(tokenFile, JSON.stringify(tokens, null, 2))
            return
          }

          if (currentFile != JSON.stringify(tokens, null, 2)) {
            results.files[localPath]['tokens'] = 'failed'
            results.failed++
          } else {
            results.files[localPath]['tokens'] = 'passed'
            results.passed++
          }

          const ast = new parser(tokens).buildAST()
          // check the ast file
          const astFile = localPath + '.ast.json'
          var currentFile = fs.readFileSync(astFile)
          if (currentFile === undefined) {
            console.log(astFile + ' was empty! Writing file ...')
            results.files[localPath]['ast'] = 'untestable'
            results.untestable++
            fs.writeFileSync(astFile, JSON.stringify(ast, null, 2))
            return
          }

          if (currentFile != JSON.stringify(ast, null, 2)) {
            results.files[localPath]['ast'] = 'failed'
            results.failed++
          } else {
            results.files[localPath]['ast'] = 'passed'
            results.passed++
          }
        }
      } else {
        testDir(localPath)
      }
    }
  })
}

console.log('Running tests from: '.bold + TEST_PATH.white.inverse)
console.log()

testDir(TEST_PATH)

for (test in results.files) {
  console.log(test.underline)
  if (test === undefined) {
    console.log('Could not test')
  }

  for (stage in results.files[test]) {
    if (results.files[test][stage] == 'passed') {
      console.log(stage.padEnd(7).bold + ': ' + 'passed ✓'.info)
    } else {
      console.log(stage.padEnd(7).bold + ': ' + 'failed ✗'.error)
    }
  }

  console.log()
}

console.log('------------------------')

console.log()
console.log('Results:\n'.underline.bold)
const len = results.total.toString().length
console.log('Passed'.green + ': %s (%s / %d)', ((results.passed / results.total * 100).toString() + '%').padStart(4), results.passed.toString().padStart(len), results.total)
console.log('Failed'.red + ': %s (%s / %d)', ((results.failed / results.total * 100).toString() + '%').padStart(4), results.failed.toString().padStart(len), results.total)

if (!results.failed) {
  console.log('\nOverall: ' + 'passed ✓'.info)
} else {
  console.log('\nOverall: ' + 'failed ✗'.error)
}
