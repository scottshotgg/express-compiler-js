// const commonFactory = require('./js');

var nodes = {
  type: "program",
  statements: []
};

var i = 0;
var tokens;

// const common = commonFactory(tokens);

module.exports = {
  buildAST: buildAST
};

function buildAST(_tokens) {
  tokens = _tokens;

  for (i = 0; i < tokens.length; i++) {
    const stmt = getStatement();
    if (stmt && stmt.type === "error") {
      console.error(`\n${stmt.msg}\n\n${stmt.hint}`);
      console.error(tokens[i]);
      console.error(stmt.stack);

      process.exit(9);
    }

    nodes.statements.push(stmt);
  }

  return nodes;
}

function getStatement() {
  var tok = tokens[i];

  switch (tok.type) {
    case "type":
      var type = tok.value;
      console.log({
        cur: tok,
        next: tokens[i + 1],
        nextnext: tokens[i + 2]
      });
      if (isNextToken("lbracket") && isNextToken("rbracket", 2)) {
        type += "[]";

        i += 2;
      }

      return getDeclarationStatement(false, type);

    // let and var
    case "declaration":
      return getDeclarationStatement(true);

    case "loop":
      return getLoop();

    case "control":
      return getControl();

    case "ident":
      if (isNextToken("lparen")) {
        return getFunctionCall();
      }
      return getAssignment();

    case "return":
      return getReturn();

    default:
      return getHint();
  }
}

function getExpression() {
  i++;
  const term = getTerm();

  if (isNextToken("bin_op")) {
    i++;
    return {
      type: "expression",
      kind: "bin_op",
      value: tokens[i].value,
      left: term,
      right: getExpression()
    };
  }

  return term;
}

function getTerm() {
  const factor = getFactor();
  const tok = tokens[i];

  if (isNextToken("pri_op")) {
    i++;
    return {
      type: "expression",
      kind: "bin_op",
      value: tok.value,
      left: factor,
      right: getExpression()
    };
  } else if (isNextToken("comparator")) {
    i++;
    return {
      type: "expression",
      kind: "comp_op",
      value: tok.value,
      left: factor,
      right: getExpression()
    };
  } else if (
    (isNextToken("assign") ||
      (isNextToken("unary") && isNextTokenValue("!"))) &&
    isNextToken("assign", 2)
  ) {
    i++;
    i++;
    return {
      type: "expression",
      kind: "comp_op",
      value: tokens[i - 1].value + tokens[i].value,
      left: factor,
      right: getExpression()
    };
  }

  return factor;
}

function getFactor() {
  const tok = tokens[i];

  // Literal and Ident are the ground states
  switch (tok.type) {
    case "literal":
      if (isNextToken("selector") && tokens[i + 2].type != "selector") {
        i++;
        const expr = getExpression();
        if (typeof expr === "undefined") {
          return getHint();
        }

        return {
          type: "literal",
          kind: "float",
          // mantissa and abscissa
          value: parseFloat(tok.value + "." + expr.value)
        };
      }

      return tok;

    case "unary":
      const notExpr = getExpression();
      if (notExpr == undefined) {
        return getHint();
      }

      return {
        type: "expression",
        kind: "not",
        value: notExpr
      };

    case "ident":
      if (isNextToken("lparen")) {
        return getFunctionCall();
      }

      if (i === tokens.length - 1 || tokens[i + 1].type !== "selector") {
        return tok;
      }

      i++;

    case "selector":
      return {
        type: "selector",
        ident: tok.value,
        selection: getExpression()
      };

    case "lparen":
      const expr = getExpression();
      if (isNextToken("rparen")) {
        i++;
        return expr;
      }

      i++;
      return getHint();

    case "lbracket":
      return getArray();

    case "lbrace":
      return getBlock();

    case "quote":
      return getString();

    default:
      return getHint();
  }
}

function getAssignment() {
  const tok = tokens[i];

  if (!isNextToken("assign")) {
    return getHint();
  }

  i++;

  const expr = getExpression();

  return {
    type: "assignment",
    ident: tok.value,
    value: expr
  };
}

// ( `let` | `var` ) IDENT `=` EXPRESSION
function getDeclarationStatement(infer, kind = tokens[i]) {
  if (tokens[i].value == "function") {
    return getFunction();
  }

  i++;

  const tok = tokens[i];

  if (i < tokens.length && tok.type != "ident") {
    return getHint();
  }

  i++;
  if (i < tokens.length && tokens[i].type != "assign") {
    return getHint();
  }

  return {
    type: "declaration",
    infer: infer,
    kind: kind,
    ident: tok.value,
    value: getExpression()
  };
}

function getArray() {
  var expressions = [];

  while (i < tokens.length - 1 && tokens[i + 1].type != "rbracket") {
    var expr = getExpression();
    if (expr === undefined) {
      return getHint();
    }

    expressions.push(expr);
  }

  i++;

  return {
    type: "literal",
    kind: "array",
    value: expressions
  };
}

function getBlock() {
  var statements = [];

  i++;
  while (i < tokens.length - 1 && tokens[i].type != "rbrace") {
    var stmt = getStatement();
    if (stmt === undefined) {
      return getHint();
    }

    statements.push(stmt);
    i++;
  }

  return {
    type: "literal",
    kind: "block",
    value: statements
  };
}

function getReturn() {
  return {
    type: "return",
    value: getExpression()
  };
}

function getString() {
  var string = "";

  i++;
  while (i < tokens.length - 1 && tokens[i].type != "quote") {
    string += tokens[i].value;

    i++;
  }

  return {
    type: "literal",
    kind: "string",
    value: string
  };
}

function getSelection(prevExpr) {
  const tok = tokens[i];

  // if (prevExpr && tokens[i].type != "selector") {
  //   console.log("i got here")
  //   return {
  //     type: "selector",
  //     ident: tok.value,
  //     selection: prevExpr
  //   }
  // }

  const expression = getExpression();

  console.log({
    expression,
    tok,
    curTok: tokens[i]
  });
  process.exit(9);

  return {
    type: "selector",
    ident: tok.value,
    selection: getSelection(prevExpr || expression)
  };
}

// TODO: add some fucking error checking
function getLoop() {
  const loop = {
    kind: tokens[i].value
  };

  const expr = getExpression();

  // skip over the .. (2 selectors) for now
  i++;
  i++;

  const expr1 = getExpression();
  console.log("stuff", expr, expr1);

  loop.start = expr;
  loop.end = expr1;
  loop.step = 1;

  i++;

  loop.block = getBlock();

  return loop;
}

// TODO: add some fucking error checking
function getControl() {
  const tok = tokens[i];

  let expr;
  switch (tok.value) {
    case "if":
      expr = getExpression();
      break;

    case "else":
      if (isNextTokenValue("if")) {
        i++;
        return getControl();
      }

      break;

    default:
      return getHint();
  }

  i++;
  const body = getBlock();

  return {
    condition: expr,
    body
  };
}

// TODO: implement some fucking error checking
function getFunction() {
  var returnTypes = [];

  i++;
  const ident = tokens[i];
  console.log(ident);

  if (ident.type !== "ident") {
    return getHint();
  }

  if (!isNextToken("lparen")) {
    return getHint();
  }

  var args = [];

  i++;
  i++;

  // args
  while (tokens[i].type !== "rparen") {
    if (tokens[i].type !== "type" || !isNextToken("ident")) {
      return getHint();
    }

    const kind = tokens[i].value;
    i++;

    const argIdent = tokens[i].value;
    i++;

    args.push({
      type: "ident",
      kind,
      value: argIdent
    });
  }
  console.log("args", args);

  if (isNextTokenValue("-") && isNextTokenValue(">", 2)) {
    // @TODO do stuff with return types
    i++;
    i++;

    while (isNextToken("type")) {
      i++;
      console.log("i am hereeeee");
      const type = tokens[i];
      returnTypes.push(type);
    }
  }
  i++;

  if (tokens[i].type !== "lbrace") {
    return getHint();
  }

  // body
  const body = getBlock();

  return {
    type: "declaration",
    kind: "function",
    ident: ident.value,
    args: args,
    returns: returnTypes,
    body: body
  };
}

// function getFunctionArgs() {
//   if (!isNextToken("lparen")) {
//     return getHint();
//   }

//   var args = [];

//   i++
//   i++

//   // args
//   while (tokens[i].type !== "rparen") {
//     console.log("i am hereeeee")
//     const expr2 = getExpression()
//     args.push(expr2)
//   }
//   console.log("args", args)

//   return args;
// }

function getFunctionCall() {
  const ident = tokens[i];

  i++;
  i++;

  let params = [];

  // params
  while (tokens[i].type !== "rparen") {
    console.log("i am hereeeee");
    const param = tokens[i];
    if (param.type !== "ident") {
      return getHint();
    }

    params.push(param);
    i++;
  }

  console.log("params", params);

  return {
    type: "call",
    ident,
    params
  };
}

function getHint() {
  const firstSource = tokens
    .slice(i - 5, i)
    .map(v => v.value)
    .join("");

  const lastSource = tokens
    .slice(i, i + 5)
    .map(v => v.value)
    .join("");

  const source = firstSource + lastSource;

  const err = new Error("");

  const stack = err.stack
    .split(/\n/)
    .slice(2)
    .map(v => v.trim().split(/\s+/)[1]);

  const hint = `${source}\n${" ".repeat(firstSource.length)}^`;
  const curFun = stack.shift();

  // @TODO: start we need to break in other areas
  console.error(`\n${curFun}\n\n${hint}`);
  console.error(tokens[i]);
  console.error(stack);
  process.exit(9);
  // @TODO: end we need to break in other areas

  return {
    type: "error",
    msg: `Not implemented in ${curFun}`,
    hint,
    stack
  };
}

function isNextToken(type, offset = 1) {
  return i < tokens.length - offset && tokens[i + offset].type == type;
}

function isNextTokenValue(value, offset = 1) {
  return i < tokens.length - offset && tokens[i + offset].value == value;
}
