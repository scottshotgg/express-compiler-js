module.exports = function (tokens) {

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

  function isNextToken(type) {
    return i < tokens.length - 1 && tokens[i + 1].type == type;
  }

  return {
    getHint: getHint,
    isNextToken: isNextToken
  }
}
