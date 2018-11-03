const lexer = require("./lexer.js");
const parser = require("./parser.js");
const fs = require("fs");
const util = require("util");

const filename = process.argv[2];
if (!filename) {
  console.log("You must specify a file to compile");
  return;
}

const filedata = fs.readFileSync(filename).toString();

// console.log(filedata, "\n\n")

const tokens = lexer.lex(filedata);
console.log(tokens);
console.log("\n");

const ast = parser.buildAST(tokens);
console.log(util.inspect(ast, { depth: null, colors: true }));
