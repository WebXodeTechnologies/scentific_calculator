type Token =
  | { t: "num"; v: number }
  | { t: "fn"; v: string }
  | { t: "op"; v: string }
  | { t: "lp"; v: string }
  | { t: "rp"; v: string }
  | { t: "comma" };

type AngleMode = "DEG" | "RAD";

const CONST: Record<string, number> = { pi: Math.PI, e: Math.E };

const getFuncs = (angleMode: AngleMode): Record<string, (x: number) => number> => {
  const toRad = (x: number) => (angleMode === "DEG" ? (x * Math.PI) / 180 : x);
  const fromRad = (x: number) => (angleMode === "DEG" ? (x * 180) / Math.PI : x);

  return {
    sin: (x) => Math.sin(toRad(x)),
    cos: (x) => Math.cos(toRad(x)),
    tan: (x) => Math.tan(toRad(x)),
    asin: (x) => fromRad(Math.asin(x)),
    acos: (x) => fromRad(Math.acos(x)),
    atan: (x) => fromRad(Math.atan(x)),
    log: (x) => Math.log10(x),
    ln: (x) => Math.log(x),
    sqrt: Math.sqrt,
    cbrt: Math.cbrt,
    abs: Math.abs,
    exp: Math.exp,
    random: () => Math.random(),
  };
};

const OPS: Record<string, any> = {
  "+": { p: 1, a: "L", fn: (a: number, b: number) => a + b },
  "-": { p: 1, a: "L", fn: (a: number, b: number) => a - b },
  "*": { p: 2, a: "L", fn: (a: number, b: number) => a * b },
  "/": { p: 2, a: "L", fn: (a: number, b: number) => a / b },
  "%": { p: 2, a: "L", fn: (a: number, b: number) => a % b },
  "^": { p: 4, a: "R", fn: (a: number, b: number) => Math.pow(a, b) },
  "u-": { p: 3, a: "R", unary: true, fn: (a: number) => -a },
  "!": { p: 5, a: "L", postfix: true, fn: (a: number) => factorial(a) },
};

function factorial(n: number): number {
  if (n < 0 || !Number.isFinite(n)) return NaN;
  if (n > 170) return Infinity;
  if (Math.floor(n) !== n) {
    // gamma approx
    return gamma(n + 1);
  }
  let r = 1;
  for (let i = 2; i <= n; i++) r *= i;
  return r;
}

function gamma(z: number): number {
  const g = 7;
  const c = [
    0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313,
    -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6,
    1.5056327351493116e-7,
  ];
  if (z < 0.5) return Math.PI / (Math.sin(Math.PI * z) * gamma(1 - z));
  z -= 1;
  let x = c[0];
  for (let i = 1; i < g + 2; i++) x += c[i] / (z + i);
  const t = z + g + 0.5;
  return Math.sqrt(2 * Math.PI) * Math.pow(t, z + 0.5) * Math.exp(-t) * x;
}

function tokenize(input: string, vars: Record<string, number> = {}): Token[] {
  let s = input
    .replace(/\s+/g, "")
    .replace(/×/g, "*")
    .replace(/÷/g, "/")
    .replace(/−/g, "-")
    .replace(/√/g, "sqrt")
    .replace(/∛/g, "cbrt");
  const tokens: Token[] = [];
  let i = 0;
  while (i < s.length) {
    const ch = s[i];
    if (/[0-9.]/.test(ch)) {
      let num = "";
      while (i < s.length && /[0-9.]/.test(s[i])) {
        num += s[i++];
      }
      tokens.push({ t: "num", v: parseFloat(num) });
    } else if (/[a-zA-Z_]/.test(ch)) {
      let id = "";
      while (i < s.length && /[a-zA-Z_0-9]/.test(s[i])) {
        id += s[i++];
      }
      if (s[i] === "(") tokens.push({ t: "fn", v: id });
      else if (CONST[id] !== undefined) tokens.push({ t: "num", v: CONST[id] });
      else if (vars[id] !== undefined) tokens.push({ t: "num", v: vars[id] });
      else throw new Error("Unknown identifier: " + id);
    } else if ("+-*/%^!()".includes(ch)) {
      tokens.push({ t: ch === "(" ? "lp" : ch === ")" ? "rp" : "op", v: ch });
      i++;
    } else if (ch === ",") {
      tokens.push({ t: "comma" });
      i++;
    } else throw new Error("Unexpected: " + ch);
  }

  const out: Token[] = [];
  for (let j = 0; j < tokens.length; j++) {
    const tk = tokens[j],
      prev = tokens[j - 1];
    if (tk.t === "op" && tk.v === "-" && (!prev || prev.t === "op" || prev.t === "lp" || prev.t === "comma")) {
      out.push({ t: "op", v: "u-" });
    } else {
      if (prev && (prev.t === "num" || prev.t === "rp") && (tk.t === "num" || tk.t === "fn" || tk.t === "lp")) {
        out.push({ t: "op", v: "*" });
      }
      out.push(tk);
    }
  }
  return out;
}

function toRPN(tokens: Token[]): Token[] {
  const out: Token[] = [],
    stack: Token[] = [];
  for (const tk of tokens) {
    if (tk.t === "num") out.push(tk);
    else if (tk.t === "fn") stack.push(tk);
    else if (tk.t === "op") {
      const o1 = OPS[tk.v];
      while (stack.length) {
        const top = stack[stack.length - 1];
        if (top.t === "op") {
          const o2 = OPS[top.v];
          if ((o1.a === "L" && o1.p <= o2.p) || (o1.a === "R" && o1.p < o2.p)) {
            out.push(stack.pop()!);
            continue;
          }
        } else if (top.t === "fn") {
          out.push(stack.pop()!);
          continue;
        }
        break;
      }
      stack.push(tk);
    } else if (tk.t === "lp") stack.push(tk);
    else if (tk.t === "rp") {
      while (stack.length && stack[stack.length - 1].t !== "lp") out.push(stack.pop()!);
      if (!stack.length) throw new Error("Mismatched parentheses");
      stack.pop();
      if (stack.length && stack[stack.length - 1].t === "fn") out.push(stack.pop()!);
    }
  }
  while (stack.length) {
    const top = stack.pop()!;
    if (top.t === "lp" || top.t === "rp") throw new Error("Mismatched parentheses");
    out.push(top);
  }
  return out;
}

function evalRPN(rpn: Token[], funcs: Record<string, (x: number) => number>): number {
  const st: number[] = [];
  for (const tk of rpn) {
    if (tk.t === "num") st.push(tk.v);
    else if (tk.t === "op") {
      const o = OPS[tk.v];
      if (o.unary || o.postfix) {
        const a = st.pop()!;
        st.push(o.fn(a));
      } else {
        const b = st.pop()!,
          a = st.pop()!;
        st.push(o.fn(a, b));
      }
    } else if (tk.t === "fn") {
      const a = st.pop()!;
      if (!funcs[tk.v]) throw new Error("Unknown function: " + tk.v);
      st.push(funcs[tk.v](a));
    }
  }
  if (st.length !== 1) throw new Error("Invalid expression");
  return st[0];
}

export function evaluate(
  expr: string,
  vars: Record<string, number> = {},
  angleMode: AngleMode = "DEG"
): number {
  if (!expr || !expr.trim()) return 0;
  const tokens = tokenize(expr, vars);
  const rpn = toRPN(tokens);
  const funcs = getFuncs(angleMode);
  const v = evalRPN(rpn, funcs);
  if (typeof v !== "number" || Number.isNaN(v)) throw new Error("Math error");
  return v;
}
