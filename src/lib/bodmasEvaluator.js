// =====================================================================
// BODMAS RECURSIVE DESCENT CALCULATOR EVALUATOR
// Evaluates mathematical expressions deterministically respecting operator precedence:
// 1. Parentheses ()
// 2. Percent % (postfix)
// 3. Multiplication * and Division /
// 4. Addition + and Subtraction -
// =====================================================================

export function evaluateExpression(expr) {
  if (!expr || !expr.trim()) return { result: 0, error: null };

  // Sanitize expression
  let tokens = expr
    .replace(/×/g, '*')
    .replace(/÷/g, '/')
    .replace(/−/g, '-')
    .trim();

  let pos = 0;

  function peek() {
    return tokens[pos];
  }

  function consume() {
    return tokens[pos++];
  }

  function skipWhitespace() {
    while (pos < tokens.length && /\s/.test(tokens[pos])) {
      pos++;
    }
  }

  function parseExpression() {
    let left = parseTerm();
    skipWhitespace();

    while (pos < tokens.length && (peek() === '+' || peek() === '-')) {
      const op = consume();
      const right = parseTerm();
      if (op === '+') left += right;
      if (op === '-') left -= right;
      skipWhitespace();
    }
    return left;
  }

  function parseTerm() {
    let left = parseFactor();
    skipWhitespace();

    while (pos < tokens.length && (peek() === '*' || peek() === '/')) {
      const op = consume();
      const right = parseFactor();
      if (op === '*') left *= right;
      if (op === '/') {
        if (right === 0) throw new Error('Division by zero');
        left /= right;
      }
      skipWhitespace();
    }
    return left;
  }

  function parseFactor() {
    skipWhitespace();
    let isNegative = false;

    if (peek() === '-') {
      consume();
      isNegative = true;
      skipWhitespace();
    } else if (peek() === '+') {
      consume();
      skipWhitespace();
    }

    let val = 0;

    if (peek() === '(') {
      consume(); // consume '('
      val = parseExpression();
      skipWhitespace();
      if (peek() === ')') {
        consume(); // consume ')'
      } else {
        throw new Error('Unmatched parenthesis');
      }
    } else {
      let numStr = '';
      while (pos < tokens.length && (/\d/.test(peek()) || peek() === '.')) {
        numStr += consume();
      }

      if (!numStr) {
        throw new Error('Invalid syntax');
      }

      val = parseFloat(numStr);
      if (isNaN(val)) throw new Error('Invalid number');
    }

    // Handle postfix percentage
    skipWhitespace();
    if (pos < tokens.length && peek() === '%') {
      consume();
      val = val / 100;
    }

    return isNegative ? -val : val;
  }

  try {
    const res = parseExpression();
    skipWhitespace();
    if (pos < tokens.length) {
      throw new Error('Unexpected token after calculation');
    }
    return { result: res, error: null };
  } catch (err) {
    return { result: null, error: err.message || 'Invalid Expression' };
  }
}
