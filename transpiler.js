module.exports = class Transpiler {
  constructor(ast) {
    this.ast = ast

    this.translate = function () {
      // console.log(ast)
      for (var stmt of this.ast.statements) {
        // FIXME: need to check the type of node and
        // make sure its a program

        // console.log(stmt)
        switch (stmt.type) {
          case 'declaration':
            console.log('im a declaration')

        }
      }
    }
  }
}