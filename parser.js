var nodes = {
  type: "program",
  statements: []
}

var i = 0
var tokens

module.exports = {
  buildAST: buildAST
}

function buildAST(_tokens) {
  tokens = _tokens

  for (i = 0; i < tokens.length; i++) {
    const stmt = getStatement()
    if (stmt == undefined) {
      break
    }

    nodes.statements.push(stmt)
  }

  return nodes
}

function getStatement() {
  var tok = tokens[i]

  switch (tok.type) {
    // let and var
    case "declaration":
      return getDeclarationStatement()

    default:
      console.log("not implemented statement", tok, i)
      process.exit(9)
  }
}

function getExpression() {
  i++
  const term = getTerm()

  if (i < tokens.length - 1 && tokens[i + 1].type == "bin_op") {
    i++
    return {
      type: "expression",
      kind: "bin_op",
      value: tokens[i].value,
      left: term,
      right: getExpression()
    }
  }

  return term
}

function getTerm() {
  const factor = getFactor()

  if (i < tokens.length - 1 && tokens[i + 1].type == "pri_op") {
    i++
    return {
      type: "expression",
      kind: "bin_op",
      value: tokens[i].value,
      left: factor,
      right: getExpression()
    }
  }

  return factor
}

function getFactor() {
  const tok = tokens[i]

  // Literal and Ident are the ground states
  switch (tok.type) {
    case 'literal':
      return tok

    case 'ident':
      const ident = tokens[i]
      if (ident.value.includes(".")) {
        const selections = ident.value.split(".");
        return {
          type: 'selector'
        }
      }
      return tok

    case 'lparen':
      const expr = getExpression()
      if (i < tokens.length - 1 && tokens[i + 1].type == "rparen") {
        i++
        return expr
      } else {
        return undefined
      }

    case 'lbracket':
      return getArray()

    case 'lbrace':
      return getBlock()

    case 'quote':
      return getString()

    default:
      console.log("not implemented factor", tok)
      process.exit(9)
  }
}

// ( `let` | `var` ) IDENT `=` EXPRESSION
function getDeclarationStatement() {
  i++

  const tok = tokens[i]

  if (i < tokens.length && tok.type != "ident") {
    return undefined
  }

  i++
  if (i < tokens.length && tokens[i].type != "assign") {
    return undefined
  }

  return {
    type: "declaration",
    ident: tok.value,
    value: getExpression()
  }
}

function getArray() {
  var expressions = []

  while (i < tokens.length - 1 && tokens[i + 1].type != 'rbracket') {
    var expr = getExpression()
    if (expr == undefined) {
      return expr
    }

    expressions.push(expr)
  }

  i++

  return {
    type: "literal",
    kind: "array",
    value: expressions
  }
}

function getBlock() {
  var statements = []

  i++
  while (i < tokens.length - 1 && tokens[i].type != 'rbrace') {
    var stmt = getStatement()
    if (stmt == undefined) {
      return stmt
    }

    statements.push(stmt)
    i++
  }

  return {
    type: "literal",
    kind: "block",
    value: statements
  }
}

function getString() {
  var string = ""

  i++
  while (i < tokens.length - 1 && tokens[i].type != 'quote') {
    string += tokens[i].value

    i++
  }

  return {
    type: "literal",
    kind: "string",
    value: string
  }
}