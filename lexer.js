const lexemes = {
  let: {
    type: "declaration",
    value: "let"
  },
  var: {
    type: "type",
    value: "var"
  },
  int: {
    type: "type",
    value: "int"
  },
  float: {
    type: "type",
    value: "float"
  },
  string: {
    type: "type",
    value: "string"
  },
  bool: {
    type: "type",
    value: "bool"
  },

  for: {
    type: "loop",
    value: "for"
  },
  if: {
    type: "control",
    value: "if"
  },
  else: {
    type: "control",
    value: "else"
  },
  function: {
    type: "declaration",
    value: "function"
  },
  // convert `fn` tokens to `function` tokens for easier parsing;
  // don't care if they aren't marked as lambdas for now
  fn: {
    type: "declaration",
    value: "function"
  },
  return: {
    type: "return",
    value: "return"
  },

  // TODO: need to implement <= or >=
  ">": {
    type: "comparator",
    value: ">"
  },
  "<": {
    type: "comparator",
    value: "<"
  },
  "!": {
    type: "unary",
    value: "!"
  },

  "=": {
    type: "assign",
    value: "="
  },
  ":": {
    type: "assign",
    value: ":"
  },

  '"': {
    type: "quote",
    value: '"'
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
  "-": {
    type: "bin_op",
    value: "-"
  },
  "*": {
    type: "pri_op",
    value: "*"
  },
  "/": {
    type: "pri_op",
    value: "/"
  },
  ".": {
    type: "selector",
    value: "."
  }
};

var tokens = [];

var accumulator = "";

module.exports = {
  lex: lex
};

function lex(filedata) {
  for (var i = 0; i < filedata.length; i++) {
    const char = filedata[i];
    if (char === "/" && i < filedata.length - 1 && filedata[i + 1] === "*") {
      i++; // skip "/"
      i++; // skip "*"
      while (
        i < filedata.length - 2 &&
        filedata[i] !== "*" &&
        filedata[i + 1] !== "/"
      ) {
        i++; // skip any or "*"
      }
      i++; // skip last "/"
    } else if (
      char === "/" &&
      i < filedata.length - 1 &&
      filedata[i + 1] === "/"
    ) {
      i++; // skip "/"
      i++; // skip next "/"
      do {
        i++; // skip rest and "\n"
      } while (filedata[i] !== "\n");
    } else if (lexemes[accumulator]) {
      tokens.push(lexemes[accumulator]);
      accumulator = char;
    } else if (lexemes[char]) {
      if (accumulator != "") {
        tokens.push(lexLit(accumulator));
        accumulator = "";
      }

      tokens.push(lexemes[char]);
    } else if (char.charCodeAt(0) < 33 || char.charCodeAt(0) > 127) {
      if (accumulator != "") {
        tokens.push(lexLit(accumulator));
      }
      accumulator = "";
    } else {
      accumulator += char;
    }
  }

  if (accumulator != "") {
    tokens.push(lexLit(accumulator));
  }

  return tokens;
}

function lexLit(acc) {
  var literal;

  if (acc.includes(".")) {
    literal = parseFloat(acc);
    if (!isNaN(literal)) {
      return {
        type: "literal",
        kind: "float",
        value: literal
      };
    }
  }

  literal = parseInt(acc);
  if (!isNaN(literal)) {
    return {
      type: "literal",
      kind: "int",
      value: literal
    };
  }

  return {
    type: "ident",
    value: acc
  };
}
