// Expression AST evaluator (safe: no eval)

export function evalExpression(expr, vars) {
  if (expr == null) return 0;

  // primitives
  if (typeof expr === "number") return expr;
  if (typeof expr === "boolean") return expr;
  if (typeof expr === "string") {
    // treat as variable name if exists, else parse number
    if (Object.prototype.hasOwnProperty.call(vars, expr)) return vars[expr];
    const n = Number(expr);
    return Number.isFinite(n) ? n : 0;
  }

    if (expr && typeof expr === "object" && expr.kind === "str") {
    return String(expr.value ?? "");
  }

  

  // AST nodes
  switch (expr.kind) {
    case "num":
      return Number(expr.value) || 0;

    case "bool":
      return !!expr.value;

    case "var":
      return Object.prototype.hasOwnProperty.call(vars, expr.name) ? vars[expr.name] : 0;

    case "bin": {
      const a = Number(evalExpression(expr.left, vars)) || 0;
      const b = Number(evalExpression(expr.right, vars)) || 0;
      switch (expr.op) {
        case "+": return a + b;
        case "-": return a - b;
        case "*": return a * b;
        case "/": return b === 0 ? 0 : a / b;
        default: return 0;
      }
    }

    case "cmp": {
      const a = Number(evalExpression(expr.left, vars)) || 0;
      const b = Number(evalExpression(expr.right, vars)) || 0;
      switch (expr.op) {
        case ">": return a > b;
        case "<": return a < b;
        case "==": return a === b;
        default: return false;
      }
    }

    case "logic": {
      const a = Boolean(evalExpression(expr.left, vars));
      const b = Boolean(evalExpression(expr.right, vars));
      switch (expr.op) {
        case "and": return a && b;
        case "or": return a || b;
        default: return false;
      }
    }

    case "str":
  return String(expr.value ?? "");


    default:
      return 0;
  }
}
