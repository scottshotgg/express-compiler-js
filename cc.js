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
var includesMap = {}

function translateObject(value) {
  console.log("thingy brah")
  console.log({value})

  
  
  return "{Object o;" + translateBlock(value) + value.map(stmt => {
    if (stmt.type === 'declaration')
      return 'o.AddProp("' + stmt.ident + '",' + stmt.ident + ');'

  }).join('')
  
}

function translateExpression(expr) {
  switch (expr.type) {
    case 'not':
      // TODO: this will require some more thought

    case 'call':
      return expr.ident.value + '('
        + expr.params.map(param =>
          translateExpression(param)).join(',') + ')'

    case 'literal':
      if (expr.kind == 'string') {
        return "\"" + expr.value + "\""
      } else if (expr.kind == 'Object') {
        console.log('Expression blocks (objects) have not been implemented')

        // console.log('Object ' + JSON.stringify(expr.value))
        console.log(translateObject(expr.value))
        return translateObject(expr.value)
        // process.exit(9)

        // var a
        // {
        // index statements using `translateObject`
        // normal statements
        // }
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

    case 'selector':
    if (includesMap[expr.ident] !== undefined) {
      return translateExpression(expr.value)
    }

    const ident = scopeTree[expr.ident]
    console.log({ident})
    if (ident.type === 'Object') {
      return expr.ident + '["' + translateExpression(expr.value) + '"]'
    }

    return [expr.ident, translateExpression(expr.value)].join('.')

    default:
      console.log('could not translate:', expr)
      process.exit(9)
  }
}

fs.writeFileSync('main.cpp', doTranslation())

function doTranslation() {
  var thing = translateBlock(ast.value)
  return includes + '#include <string>\nusing namespace std;int main(){'
  + thing
  + '}'
}

function translateStatement(stmt) {}

function translateBlock(stmts) {
  let ret = ''
  for (var something in stmts) {
    var stmt = stmts[something]

    switch (stmt.type) {
      case 'call':
        console.log('stuffy', stmt.params)
        ret += stmt.ident.value + '('
          + stmt.params.map(param =>
              translateExpression(param)
          ).join(',') + ');'
        break

      case 'selector':
        if (includesMap[stmt.ident] !== undefined) {
          ret += translateExpression(stmt.value) + ';'
          break
        }

        // FIXME: move to expression
        ret += stmt.ident + '.' + stmt.value.ident.value
        if (stmt.value.type == 'call') {
          ret += '();'
        }
        break

      case 'import':
        scopeTree[stmt.value.type] = stmt.value
        // c lib
        if (stmt.value.ident == 'c') {
          includesMap[stmt.value.ident] = true
          includes += '#include <' + translateExpression(stmt.value.value) + '.h>\n'
        // stdlib (for now)
        } else {
          includesMap[stmt.value.value] = true
          includes += '#include "lib/' + translateExpression(stmt.value) + '.cpp"\n'
        }
        break

      case 'include':
        scopeTree[stmt.value.value] = stmt.value
        includesMap['c'] = true
        includes += '#include <' + translateExpression(stmt.value) + '.h>\n'
        break

      case 'assignment':
      // var kind = stmt.value.kind
      // console.log("scopeTree", scopeTree)
      // if (kind === undefined || kind === '') {
      //   if (stmt.value.type == 'bin_op') {
      //     const left = translateExpression(stmt.value.left)
      //     const right = translateExpression(stmt.value.right)
      //     let leftType
      //     if (stmt.value.left.type === 'literal') {
      //       leftType = stmt.value.left.kind
      //     } else {
      //       leftType = scopeTree[left].type
      //     }
      //     let rightType
      //     if (stmt.value.right.type === 'literal') {
      //       rightType = stmt.value.right.kind
      //     } else {
      //       rightType = scopeTree[right].type
      //     }
      //     console.log('types', leftType, rightType)
      //     if (leftType === rightType) {
      //       kind = leftType
      //     } else {
      //       console.log()
      //       console.log('ONLY same type operations for now')
      //       console.log()
      //       process.exit(9)
      //     }
      //   }
      // }
      // scopeTree[stmt.ident] = {
      //   value: stmt.value,
      //   type: kind
      // }
      // console.log("thingy", scopeTree[stmt.ident])

      ret += stmt.ident + " = " + translateExpression(stmt.value) + ";"
      break

      case 'declaration':
        var kind = stmt.value.kind
        if (kind === undefined || kind === '') {
          if (stmt.value.type == 'bin_op') {
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

        if (kind === undefined) {
          kind = scopeTree[stmt.value.value].type
        }

        scopeTree[stmt.ident] = {
          value: stmt.value,
          type: kind
        }

        ret += kind + ' ' + stmt.ident

        if (stmt.value.kind === 'Object') {
          includes += '#include "lib/object.cpp"\n'
          ret += ';' + translateExpression(stmt.value) + stmt.ident + '=o;}'
        } else {
          ret += ' = ' + translateExpression(stmt.value) + ';';
        }

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

