const lexemes = {
  let: {
    type: 'declaration',
    value: 'let'
  },
  var: {
    type: 'type',
    value: 'var'
  },
  int: {
    type: 'type',
    value: 'int'
  },
  float: {
    type: 'type',
    value: 'float'
  },
  string: {
    type: 'type',
    value: 'string'
  },
  bool: {
    type: 'type',
    value: 'bool'
  },
  object: {
    type: 'type',
    value: 'object'
  },

  // inject these literals as valid token values
  // since they are effectively keywords anyways
  true: {
    type: 'literal',
    kind: 'bool',
    value: true
  },
  false: {
    type: 'literal',
    kind: 'bool',
    value: false
  },

  for: {
    type: 'loop',
    value: 'for'
  },

  if: {
    type: 'control',
    value: 'if'
  },
  else: {
    type: 'control',
    value: 'else'
  },

  import: {
    type: 'import',
    value: 'import'
  },
  include: {
    type: 'include',
    value: 'include'
  },

  function: {
    type: 'declaration',
    value: 'function'
  },
  // convert `fn` this.tokens to `function` this.tokens for easier parsing;
  // don't care if they aren't marked as lambdas for now
  fn: {
    type: 'declaration',
    value: 'function'
  },
  return: {
    type: 'return',
    value: 'return'
  },

  // TODO: need to implement <= or >=
  '>': {
    type: 'comparator',
    value: '>'
  },
  '<': {
    type: 'comparator',
    value: '<'
  },

  '!': {
    type: 'unary',
    value: '!'
  },

  '=': {
    type: 'assign',
    value: '='
  },
  ':': {
    type: 'assign',
    value: ':'
  },

  '\"': {
    type: 'quote',
    value: '\"'
  },
  '(': {
    type: 'lparen',
    value: '('
  },
  ')': {
    type: 'rparen',
    value: ')'
  },
  '[': {
    type: 'lbracket',
    value: '['
  },
  ']': {
    type: 'rbracket',
    value: ']'
  },
  '{': {
    type: 'lbrace',
    value: '{'
  },
  '}': {
    type: 'rbrace',
    value: '}'
  },

  '+': {
    type: 'bin_op',
    value: '+'
  },
  '-': {
    type: 'bin_op',
    value: '-'
  },
  '*': {
    type: 'pri_op',
    value: '*'
  },
  '/': {
    type: 'pri_op',
    value: '/'
  },

  '.': {
    type: 'selector',
    value: '.'
  },

  ',': {
    type: 'separator',
    value: ','
  }
}

module.exports = class Lexer {
  constructor(filedata) {
    this.program = filedata
    this.tokens = []
    this.accumulator = ''

    this.lex = function (filedata) {
      for (var i = 0; i < filedata.length; i++) {
        const char = filedata[i];
        if (char === '/' && i < filedata.length - 1 && filedata[i + 1] === '*') {
          i++; // skip '/'
          i++; // skip '*'
          while (
            i < filedata.length - 2 &&
            filedata[i] !== '*' &&
            filedata[i + 1] !== '/'
          ) {
            i++; // skip any or '*'
          }
          i++; // skip last '/'
        } else if (
          char === '/' &&
          i < filedata.length - 1 &&
          filedata[i + 1] === '/'
        ) {
          i++; // skip '/'
          i++; // skip next '/'
          do {
            i++; // skip rest and '\n'
          } while (filedata[i] !== '\n');
          continue
        } else if (lexemes[this.accumulator]) {
          this.tokens.push(lexemes[this.accumulator]);
          this.accumulator = '';
        }

        if (char.charCodeAt(0) < 33 || char.charCodeAt(0) > 127) {
          if (this.accumulator != '') {
            this.tokens.push(this.lexLit(this.accumulator));
          }
          this.accumulator = '';
          // Use the lexer to collect strings
        } else if (char == '"') {
          i++
          var string = ""
          while (i < filedata.length && filedata[i] != '"') {
            // Escape character
            if (filedata[i] == '\\') {
              string += filedata[i]
              i++
            }
            string += filedata[i]
            i++
          }

          this.tokens.push({
            type: 'literal',
            kind: 'string',
            value: string
          })
          // Force accumulator lexing if there is a separator
        } else if(char === ',') {
          if (this.accumulator != '') {
            const lexeme = this.lexLit(this.accumulator)
            if (lexeme === undefined) {
              console.log('Could not process accumulator:', this.accumulator)
              process.exit(9)
            }
            this.tokens.push(lexeme);
            this.accumulator = '';
          }
        } else if (lexemes[char]) {
          if (this.accumulator != '') {
            this.tokens.push(this.lexLit(this.accumulator));
            this.accumulator = '';
          }

          this.tokens.push(lexemes[char]);
        } else {
          this.accumulator += char;
        }
      }

      if (this.accumulator != '') {
        this.tokens.push(this.lexLit(this.accumulator));
      }

      return this.tokens;
    }

    // this.lex = function (filedata) {
    //   for (const char of filedata) {
    //     if (lexemes[this.accumulator]) {
    //       this.tokens.push(lexemes[this.accumulator])
    //       this.accumulator = ""
    //     } else if (char == " " || char == "\n") {
    //       if (this.accumulator != "") {
    //         this.tokens.push(this.lexLit(this.accumulator))
    //       }
    //       this.accumulator = ""
    //     } else if (lexemes[char]) {
    //       if (this.accumulator != "") {
    //         this.tokens.push(this.lexLit(this.accumulator))
    //         this.accumulator = ""
    //       }
    
    //       this.tokens.push(lexemes[char])
    //     } else {
    //       this.accumulator += char
    //     }
    //   }
    
    //   if (this.accumulator != "") {
    //     this.tokens.push(this.lexLit(this.accumulator))
    //   }
    
    //   return this.tokens
    // }

    this.lexLit = function (acc) {
      var literal;

      if (acc.includes('.')) {
        literal = parseFloat(acc);
        if (!isNaN(literal)) {
          return {
            type: 'literal',
            kind: 'float',
            value: literal
          };
        }
      }

      literal = parseInt(acc);
      if (!isNaN(literal)) {
        return {
          type: 'literal',
          kind: 'int',
          value: literal
        };
      }

      return {
        type: 'ident',
        value: acc
      };
    }
  }
}