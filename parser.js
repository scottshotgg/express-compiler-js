module.exports = class Parser {
  constructor(tokens) {
    // return {
    this.tokens = tokens
    this.index = 0
    this.nodes = {
      type: "program",
      value: []
    }

    this.buildAST = function () {
      for (this.index = 0; this.index < this.tokens.length; this.index++) {
        const stmt = this.getStatement();
        if (stmt && stmt.type === "error") {
          console.error(`\n${stmt.msg}\n\n${stmt.hint}`);
          console.error(this.tokens[this.index]);
          console.error(stmt.stack);

          process.exit(9);
        }

        this.nodes.value.push(stmt);
      }

      return this.nodes;
    }

    this.getStatement = function () {
      var tok = this.tokens[this.index];

      switch (tok.type) {
        case "import":
          var expr = this.getExpression()
          return {
            type: "import",
            value: expr
          }
          case "include":
            var expr = this.getExpression()
            return {
              type: "include",
              value: expr
            }

        // var/int/bool/float/string
        case "type":
          var type = tok.value;

          if (this.isNextToken("lbracket")) {
            this.index++;
            if (this.isNextToken("rbracket")) {
              type += "[]";
            } else {
              this.index--;
              type = this.getArrayLength(tok.value);
            }
          }

          return this.getDeclarationStatement(false, type);

        // let and var
        case "declaration":
          return this.getDeclarationStatement(true);

        // for
        case "loop":
          return this.getLoop();

        // if/else
        case "control":
          return this.getControl();

        // ident
        case "ident":
          if (this.isNextToken("lparen")) {
            return this.getFunctionCall();
            // return this.getExpression()
          } else if (this.isNextToken("selector")) {
            this.index--
            return this.getExpression()
          }

          return this.getAssignment();

        // return
        case "return":
          return this.getReturn();

        default:
          return this.getHint();
      }
    }

    this.getExpression = function () {
      this.index++;
      const term = this.getTerm();

      if (this.isNextToken("bin_op")) {
        this.index++;
        const op = this.tokens[this.index].value

        const expr = this.getExpression()
        if (expr === undefined) {
          return this.getHint()
        }

        return {
          kind: this.getKindFromExpressions(term, expr),
          type: "bin_op",
          value: op,
          left: term,
          right: expr
        };
      }

      return term;
    }

    this.getTerm = function () {
      let tok
      const factor = this.getFactor();

      if (this.isNextToken("pri_op")) {
        this.index++;
        tok = this.tokens[this.index];

        const expr = this.getExpression()
        if (expr === undefined) {
          return this.getHint()
        }

        return {
          type: "expression",
          kind: "bin_op",
          value: tok.value,
          left: factor,
          right: expr
        };
      } else if (this.isNextToken("comparator")) {
        this.index++;
        tok = this.tokens[this.index];

        const expr = this.getExpression()
        if (expr === undefined) {
          return this.getHint()
        }
      
        return {
          kind: 'bool',
          type: "comp_op",
          value: tok.value,
          left: factor,
          right: expr
        };
      } else if (
        (this.isNextToken("assign") ||
          (this.isNextToken("unary") && this.isNextTokenValue("!"))) &&
        this.isNextToken("assign", 2)
      ) {
        this.index++;
        this.index++;

        var compValue = this.tokens[this.index - 1].value + this.tokens[this.index].value

        const expr = this.getExpression()
        if (expr === undefined) {
          return this.getHint()
        }

        return {
          type: "expression",
          kind: "comp_op",
          value: compValue,
          left: factor,
          right: expr
        };
      }

      return factor;
    }

    this.getFactor = function () {
      const tok = this.tokens[this.index];
      console.log('i am here', tok)
      let expr

      // Literal and Ident are the ground states
      switch (tok.type) {
        case "literal":
          if (this.isNextToken("selector") && this.tokens[this.index + 2].type != "selector") {
            this.index++;
            this.index++;

            return {
              type: "literal",
              kind: "float",
              // mantissa and abscissa
              value: parseFloat(tok.value + "." + this.tokens[this.index].value)
            };
          }

          return tok;

        case "unary":
          const notExpr = this.getExpression();
          if (notExpr == undefined) {
            return this.getHint();
          }

          return {
            type: "expression",
            kind: "not",
            value: notExpr
          };

        case "ident":
          if (this.isNextToken("lparen")) {
            console.log("im here bby")
            return this.getFunctionCall();
          }

          if (this.isNextToken("lbracket")) {
            var ret = this.getBracketSelector()
            ret.ident = tok.value
            
            return ret
          }

          if (this.isNextToken("selector") && this.tokens[this.index + 2].type == "selector") {
            return tok;
          }

          if (!this.isNextToken("selector") && !this.isNextToken("lbracket")) {
            return tok;
          }
          this.index++;

        case "selector":
          expr = this.getExpression()
          if (expr === undefined) {
            return this.getHint()
          }

          console.log("im here bby")
          return {
            type: "selector",
            ident: tok.value,
            value: expr
          };

        case "lparen":
          console.log('hey me')
          expr = this.getExpression();
          if (expr === undefined) {
            return this.getHint()
          }

          if (this.isNextToken("rparen")) {
            this.index++;
            return expr;
          }

          this.index++;
          return this.getHint();

        case "lbracket":
          return this.getArray();

        case "lbrace":
          return this.getBlock();

        case "quote":
          return this.getString();

        default:
          return this.getHint();
      }
    }

    this.getAssignment = function () {
      const tok = this.tokens[this.index];

      if (!this.isNextToken("assign")) {
        return this.getHint();
      }

      this.index++;

      const expr = this.getExpression();
      if (expr === undefined) {
        return this.getHint()
      }

      return {
        type: "assignment",
        ident: tok.value,
        value: expr
      };
    }

    // ( `let` | `var` ) IDENT `=` EXPRESSION
    this.getDeclarationStatement = function (infer, kind = this.tokens[this.index]) {
      if (this.tokens[this.index].value == "function") {
        return this.getFunction();
      }

      this.index++;

      const tok = this.tokens[this.index];

      if (this.index < this.tokens.length && tok.type != "ident") {
        return this.getHint();
      }

      // if (infer) {
        this.index++;
      // }

      if (this.index < this.tokens.length && this.tokens[this.index].type != "assign") {
        return this.getHint();
      }

      const expr = this.getExpression()
      if (expr === undefined) {
        return this.getHint()
      }

      return {
        type: "declaration",
        infer: infer,
        kind: kind,
        ident: tok.value,
        value: expr
      };
    }

    this.getArray = function () {
      var expressions = [];

      while (this.index < this.tokens.length - 1 && this.tokens[this.index + 1].type != "rbracket") {
        const expr = this.getExpression();
        if (expr === undefined) {
          return this.getHint();
        }

        expressions.push(expr);
      }

      this.index++;

      return {
        type: "literal",
        kind: "array",
        value: expressions
      };
    }

    this.getArrayLength = function (type) {
      this.index++;
      const expr = this.getExpression();
      if (expr === undefined) {
        return this.getHint()
      }

      this.index++;

      return {
        type: `${type}[]`,
        length: expr
      };
    }

    this.getBracketSelector = function () {
      const ident = this.tokens[this.index];
      this.index++;
      const expr = this.getExpression();
      if (expr === undefined) {
        return this.getHint()
      }

      this.index++;

      if (this.isNextToken("selector")) {
        this.index++;
        this.index++;
        const fact = this.getFactor();
        return {
          type: "selection",
          ident,
          value: {
            type: "selector",
            ident: expr,
            value: fact
          }
        };
      }

      return {
        type: "selector",
        ident: ident,
        value: expr
      };
    }

    this.getBlock = function () {
      var statements = [];

      this.index++;
      while (this.index < this.tokens.length - 1 && this.tokens[this.index].type != "rbrace") {
        var stmt = this.getStatement();
        if (stmt === undefined) {
          return this.getHint();
        }

        statements.push(stmt);
        this.index++;
      }

      return {
        type: "literal",
        kind: "Object",
        value: statements
      };
    }

    this.getReturn = function () {
      const expr = this.getExpression()
      if (expr === undefined) {
        return this.getHint()
      }

      return {
        type: "return",
        value: expr
      };
    }

    this.getString = function () {
      var string = "";

      this.index++;
      while (this.index < this.tokens.length - 1 && this.tokens[this.index].type != "quote") {
        string += this.tokens[this.index].value;

        this.index++;
      }

      return {
        type: "literal",
        kind: "string",
        value: string
      };
    }

    // TODO: add some fucking error checking
    this.getLoop = function () {
      const loop = {
        type: 'loop'
,        kind: this.tokens[this.index].value
      };

      console.log(loop)

      const expr = this.getExpression();
      if (expr === undefined) {
        return this.getHint()
      }
      console.log({
        expr
      })

      // skip over the .. (2 selectors) for now
      this.index++;
      this.index++;

      const expr1 = this.getExpression();
      if (expr1 === undefined) {
        return this.getHint()
      }

      loop.start = expr;
      loop.end = expr1;
      loop.step = 1;

      this.index++;

      loop.body = this.getBlock();

      return loop;
    }

    // TODO: add some fucking error checking
    this.getControl = function () {
      let expr;
      switch (this.tokens[this.index].value) {
        case "if":
          expr = this.getExpression();
          if (expr === undefined) {
            return this.getHint()
          }
          break;

        case "else":
          if (this.isNextTokenValue("if")) {
            this.index++;
            return this.getControl();
          }
          break;

        default:
          return this.getHint();
      }

      this.index++;



      const body = this.getBlock()
      const ret = {
        type: 'control',
        body
      }

      if (expr === undefined) {
        expr = {
          type: 'literal',
          kind: 'bool',
          value: true
        }
      }

      ret.value = expr

      return ret
    }

    // TODO: implement some fucking error checking
    this.getFunction = function () {
      var returnTypes = [];

      this.index++;
      const ident = this.tokens[this.index];

      if (ident.type !== "ident") {
        return this.getHint();
      }

      if (!this.isNextToken("lparen")) {
        return this.getHint();
      }

      var args = [];

      this.index++;
      this.index++;

      // args
      while (this.tokens[this.index].type !== "rparen") {
        if (this.tokens[this.index].type !== "type" || !this.isNextToken("ident")) {
          return this.getHint();
        }

        const kind = this.tokens[this.index].value;
        this.index++;

        const argIdent = this.tokens[this.index].value;
        this.index++;

        args.push({
          type: "ident",
          kind,
          value: argIdent
        });
      }

      if (this.isNextTokenValue("-") && this.isNextTokenValue(">", 2)) {
        // @TODO do stuff with return types
        this.index++;
        this.index++;

        while (this.isNextToken("type")) {
          this.index++;
          const type = this.tokens[this.index];
          returnTypes.push(type);
        }
      }
      this.index++;

      if (this.tokens[this.index].type !== "lbrace") {
        return this.getHint();
      }

      // body
      const body = this.getBlock();

      return {
        type: "declaration",
        kind: "function",
        ident: ident.value,
        args: args,
        returns: returnTypes,
        body: body
      };
    }

    this.getFunctionCall = function () {
      const ident = this.tokens[this.index];
      this.index++

      let params = [];

      while (!this.isNextToken("rparen")) {
        const expr = this.getExpression();
        if (expr === undefined) {
          return this.getHint()
        }

        params.push(expr);
      }
      this.index++

      return {
        type: "call",
        ident,
        params
      };
    }

    this.getHint = function () {
      const firstSource = this.tokens
        .slice(this.index - 5, this.index)
        .map(v => v.value)
        .join("");

      const lastSource = this.tokens
        .slice(this.index, this.index + 5)
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
      console.error(this.tokens[this.index]);
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

    this.isNextToken = function (type, offset = 1) {
      return this.index < this.tokens.length - offset && this.tokens[this.index + offset].type == type;
    }

    this.isNextTokenValue = function (value, offset = 1) {
      return this.index < this.tokens.length - offset && this.tokens[this.index + offset].value == value;
    }

    this.getKindFromExpressions = function(term, expr){
      console.log(term, expr)
      if (term.kind == expr.kind) {
        return term.kind
      }

      return ""
    }
  }
}