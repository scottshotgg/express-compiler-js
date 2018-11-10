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
var includes = '#include<string>\n'
var includesMap = {}
var functions = ''
var structs = ''

// This is hacky but fuck it; works for now
const inStruct = false

function translateObject(value) {
  console.log("thingy brah")
  console.log({ value })

  return "{Object o;" + translateBlock(value) + value.map(stmt => {
    if (stmt.type === 'declaration')
      return 'o.AddProp("' + stmt.ident + '",' + stmt.ident + ');'

  }).join('')
}

var typeMap = {}

function createStructInit(stmts) {
  console.log({ stmts })
  var ret = ''

  for (stmt of stmts) {
    if (stmt.type !== 'assignment') {
      console.log("Cannot have non assignment statements in struct initializer")
      process.exit(666)
    }

    ret += translateExpression(stmt.value) + ', '
  }

  return ret
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
        return translateObject(expr.value)
      } else if (expr.kind == 'struct') {
        // this is for struct returns
        return expr.ident + '{' + createStructInit(expr.value.value) + '}'
      }


      return expr.value

    case 'ident':
      return expr.value

    case 'comp_op':
      const left = translateExpression(expr.left)
      const right = translateExpression(expr.right)

      return left + expr.value + right

    case 'bin_op':
      var ret = ""
      const expr1 = translateExpression(expr.left)
      if (expr.left.kind === 'string') {
        ret += 'string(' + expr1 + ')'
      } else {
        ret += expr1
      }

      ret += expr.value

      const expr2 = translateExpression(expr.right)
      if (expr.left.kind === 'string') {
        ret += 'string(' + expr2 + ')'
      } else {
        ret += expr2
      }

      return ret

    case 'selector':
      if (includesMap[expr.ident] !== undefined) {
        return translateExpression(expr.value)
      }

      const ident = scopeTree[expr.ident]
      console.log({ ident })
      if (ident !== undefined && ident.type === 'Object') {
        return expr.ident + '["' + translateExpression(expr.value) + '"]'
      }

      var identt = expr.ident

      if (typeof identt === 'object') {
        identt = translateExpression(expr.ident)
      }

      // console.log({
      //   something: expr.ident,
      //   others: translateExpression(expr.value)
      // })

      // process.exit(9)

      return [identt, translateExpression(expr.value)].join('.')

    default:
      console.log('could not translate:', expr)
      process.exit(9)
  }
}

fs.writeFileSync('main.cpp', doTranslation())

function doTranslation() {
  var thing = translateBlock(ast.value)
  console.log({ functions })
  return includes + 'using namespace std;' + structs + functions + 'int main(){'
    + thing
    + '}'
}

function translateStatement(stmt) { }

function translateBlock(stmts) {
  let ret = ''
  for (var something in stmts) {
    var stmt = stmts[something]

    switch (stmt.type) {
      case 'return':
        ret += 'return '
        if (stmt.value !== undefined) {
          ret += translateExpression(stmt.value)
        }
        ret += ';'
        break

      case 'call':
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
        if (stmt.kind === 'type') {
          // if the TYPE of the object itself in Javascript is an object
          if (typeof stmt.value === 'object') {
            // we have a struct

            console.log({ stmttype: stmt.kind })
            if (stmt.kind !== 'type') {
              console.log("struct literal", stmt)
              process.exit(9)
            }

            const oldFunctions = functions
            functions = ''

            var block = translateBlock(stmt.value.value)
            var funcs = functions
            functions = oldFunctions

            structs += 'class ' + stmt.ident + '{ public:' + funcs + block + ' };\n\n'
            break
          }


          // Add the statement to the type map
          typeMap[stmt.ident] = stmt.value

          // This typedef is local scope only; might need to change that
          ret += 'typedef ' + stmt.value + ' ' + stmt.ident + ';'
          break
        }

        if (stmt.kind === 'function') {
          functions += translateFunction(stmt) + "\n"
          break
        }

        var kind = stmt.value.kind
        if (kind === 'struct') {
          // will need to check the type here
          kind = stmt.value.ident
        }

        // Hack in the statement kind
        if (kind === undefined) {
          kind = stmt.kind
        }

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

        // if (kind === undefined) {
        //   var ident = scopeTree[stmt.value.value]
        //   if (ident === undefined) {
        //     console.log('idk what to do:', ident)
        //     process.exit(9)
        //   }
        //   kind = ident.type
        // }

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

function translateFunction(stmt) {
  var ret = ''

  switch (stmt.returns.length) {
    case 0:
      ret += 'void '
      break

    case 1:
      // wtf not sure
      ret += stmt.returns[0].value + ' '
      break

    default:
      console.log('Multiple returns are not supported right now')
      process.exit(9)
      break
  }

  return ret + stmt.ident
    + '('
    + stmt.args.map(arg => arg.kind + ' ' + arg.value).join(', ')
    + ') {'
    + translateBlock(stmt.body.value)
    + '}\n'
}

