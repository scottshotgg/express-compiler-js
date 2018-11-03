const lexer = require('./lexer.js');

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
    if (stmt.type === "error") {
      console.error(`\n${
          stmt.msg
        }\n\n${
          stmt.hint
      }`)
      console.error(tokens[i]);
      console.error(stmt.stack);
      
      process.exit(9)
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
      return getHint()
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
      if (i < tokens.length - 1 && tokens[i + 1].type == "selector") {
        i++
        const expr = getExpression()
        if (typeof expr === "undefined") {
          return getHint()
        }

        return {
          type: 'literal',
          kind: 'float',
          // mantissa and abscissa
          value: parseFloat(tok.value + "." + expr.value)
        }
      }

      return tok

    case 'ident':
      // if (ident.value.includes(".")) {
      //   const [newIdent, ...selections] = ident.value.split(".")
      //   tokens.splice(i + 1, 0, {
      //     type: 'ident',
      //     value: selections.join(".")
      //   })
      //   return {
      //     type: 'selector',
      //     ident: newIdent,
      //     value: getExpression()
      //   }
      // }
      if (i === tokens.length - 1 || tokens[i + 1].type !== "selector") {
        return tok;
      }

      i++

    case 'selector':
      return getSelection()


    case 'lparen':
      const expr = getExpression()
      if (i < tokens.length - 1 && tokens[i + 1].type == "rparen") {
        i++
        return expr
      } else if (i + 1 < tokens.length - 1 && tokens[i + 2].type !== "selector") {
        return undefined
      }

      i++
      return getSelection(expr)

    case 'lbracket':
      return getArray()

    case 'lbrace':
      return getBlock()

    case 'quote':
      return getString()

    default:
      return getHint()
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
    if (expr === undefined) {
      return getHint()
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
    if (stmt === undefined) {
      return getHint()
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

function getSelection(prevExpr) {
  const tok = tokens[i]

  if (prevExpr && tokens[i].type != "selector") {
    console.log("i got here")
    return {
      type: "selector",
      ident: tok.value,
      selection: prevExpr
    }
  }

  const expression = getExpression()

  return {
    type: "selector",
    ident: tok.value,
    selection: getSelection(expression)
  }
}

function getHint() {
  const source = tokens
    .slice(i - 5, i + 5)
    .map(v => v.value)
    .join("")

  const err = new Error('');

  const stack = err.stack.split(/\n/).slice(2).map(
    v => v.trim().split(/\s+/)[1]
  );

  return {
    type: "error",
    msg: `Not implemented in ${stack.shift()}`,
    hint: `${source}\n${' '.repeat(5)}^`,
    stack
  }
}
