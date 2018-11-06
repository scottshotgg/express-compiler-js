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
var scopeTree = {}
var includes = ''

function translateExpression(expr) {
  switch (expr.type) {
    case 'literal':
      if (expr.kind == 'string') {
        return "\"" + expr.value + "\""
      } else if (expr.kind == 'block') {
        return ''
      }
      return expr.value

    case 'ident':
      return expr.value

    case 'comp_op':
      const left  = translateExpression(expr.left)
      const right = translateExpression(expr.right)

      return left + expr.value + right

    case 'bin_op':
    return translateExpression(expr.left)
    + expr.value
    + translateExpression(expr.right)
  }
}

fs.writeFileSync('main.cpp', doTranslation())

function doTranslation() {
  var thing = translateBlock(ast.value)
  console.log(includes)
  return includes + '#include <string>\nusing namespace std;int main(){'
  + thing
  + '}'
}

function translateBlock(stmts) {
  let ret = ''
  for (var something in stmts) {
    var stmt = stmts[something]
    // console.log(stmt)
    console.log({includes})
    switch (stmt.type) {
      case 'call':
      ret += stmt.ident.value + '('
      for (param of stmt.params) {
        ret += translateExpression(param)
      }
      ret += ');'
      break

      case 'selector':
        // FIXME: move to expression
        ret += stmt.ident + '.' + stmt.selection.ident.value
        if (stmt.selection.type == 'call') {
          ret += '();'
        }
        break

      case 'import':
        // stdlib import
        if (stmt.value.type == 'ident') {
          includes += '#include "lib/' + stmt.value.value + '.cpp"\n'
        }
        break

      case 'assignment':
      var kind = stmt.value.kind
      console.log("scopeTree", scopeTree)
      if (kind === undefined || kind === '') {
        if (stmt.value.type == 'bin_op') {
          const left = translateExpression(stmt.value.left)
          const right = translateExpression(stmt.value.right)
          let leftType
          if (stmt.value.left.type === 'literal') {
            leftType = stmt.value.left.kind
          } else {
            leftType = scopeTree[left].type
          }
          let rightType
          if (stmt.value.right.type === 'literal') {
            rightType = stmt.value.right.kind
          } else {
            rightType = scopeTree[right].type
          }
          console.log('types', leftType, rightType)
          if (leftType === rightType) {
            kind = leftType
          } else {
            console.log()
            console.log('ONLY same type operations for now')
            console.log()
            process.exit(9)
          }
        }
      }
      scopeTree[stmt.ident] = {
        value: stmt.value,
        type: kind
      }
      console.log("thingy",scopeTree[stmt.ident])

      ret += stmt.ident + " = " + translateExpression(stmt.value) + ";"
      break      

      case 'declaration':
        var kind = stmt.value.kind
        console.log("scopeTree", scopeTree)
        if (kind === undefined || kind === '') {
          if (stmt.value.type == 'bin_op') {
            console.log("left right", stmt.value.left, stmt.value.left)
            const left = translateExpression(stmt.value.left)
            const right = translateExpression(stmt.value.right)
            let leftType = scopeTree[left] && scopeTree[left].type
            if (left.type === 'literal') {
              leftType = left.kind
            }
            let rightType = scopeTree[right] && scopeTree[right].type
            if (right.type === 'literal') {
              rightType = right.kind
            }

            if (leftType === rightType) {
              kind = leftType
            } else {
              console.log()
              console.log('ONLY same type operations for now')
              console.log()
              process.exit(9)
            }
          }
        }
        scopeTree[stmt.ident] = {
          value: stmt.value,
          type: kind
        }
        console.log("thingy",scopeTree[stmt.ident])

        ret += kind + " " + stmt.ident + " = " + translateExpression(stmt.value) + ";"
        break

      case 'control':
        // TODO: gonna have to do a translateBlock or something
        ret += 'if (' + translateExpression(stmt.value) + ') {' + translateBlock(stmt.body.value) + '}'
        break

      case 'loop':
        ret += '{for (int temp='
        + translateExpression(stmt.start)
        + ';temp<'
        + translateExpression(stmt.end)
        + ';temp++){'
        + translateBlock(stmt.body.value)
        + '}}'
        break
    }
  }

  return ret
}

