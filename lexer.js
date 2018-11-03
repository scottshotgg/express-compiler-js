const lexemes = {
  "let": {
    type: "declaration",
    value: "let"
  },
  "var": {
    type: "declaration",
    value: "var"
  },

  "=": {
    type: "assign",
    value: "="
  },
  ":": {
    type: "assign",
    value: ":"
  },

  "\"": {
    type: "quote",
    value: "\""
  },
  "(": {
    type: "lparen",
    value: "("
  },
  ")": {
    type: "rparen",
    value: ")"
  },
  "[": {
    type: "lbracket",
    value: "["
  },
  "]": {
    type: "rbracket",
    value: "]"
  },
  "{": {
    type: "lbrace",
    value: "{"
  },
  "}": {
    type: "rbrace",
    value: "}"
  },

  "+": {
    type: "bin_op",
    value: "+"
  },
  "*": {
    type: "pri_op",
    value: "*"
  }
}

var tokens = []

var accumulator = ""

module.exports = {
  lex: lex
}

function lex(filedata) {
  for (char of filedata) {
    if (lexemes[accumulator]) {
      tokens.push(lexemes[accumulator])
      accumulator = ""
    } else if (char == " " || char == "\n") {
      if (accumulator != "") {
        tokens.push(lexLit(accumulator))
      }
      accumulator = ""
    } else if (lexemes[char]) {
      if (accumulator != "") {
        tokens.push(lexLit(accumulator))
        accumulator = ""
      }

      tokens.push(lexemes[char])
    } else {
      accumulator += char
    }
  }

  if (accumulator != "") {
    tokens.push(lexLit(accumulator))
  }

  return tokens
}

function lexLit(acc) {
  var literal

  if (acc.includes(".")) {
    literal = parseFloat(acc)
    if (!isNaN(literal)) {
      return {
        type: "literal",
        kind: "float",
        value: acc
      }
    }
  }

  literal = parseInt(acc)
  if (!isNaN(literal)) {
    return {
      type: "literal",
      kind: "int",
      value: acc
    }
  }

  return {
    type: "ident",
    value: acc
  }
}

