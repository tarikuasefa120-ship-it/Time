let memory = 0;
let angleMode = "deg";
const display = document.getElementById("display");
const modeButton = document.getElementById("modeButton");
const themeToggle = document.getElementById("themeToggle");

function toggleTheme() {
  document.body.classList.toggle("dark");
  themeToggle.textContent = document.body.classList.contains("dark") ? "☀️" : "🌙";
}

function setCursorToEnd(el) {
  el.focus();
  el.setSelectionRange(el.value.length, el.value.length);
}

function insertAtCursor(text) {
  const start = display.selectionStart;
  const end = display.selectionEnd;
  const before = display.value.substring(0, start);
  const after = display.value.substring(end);
  display.value = before + text + after;
  const pos = start + text.length;
  display.setSelectionRange(pos, pos);
  display.focus();
}

function append(val) {
  insertAtCursor(val);
}

function appendTrig(fn) {
  insertAtCursor(fn + '(');
}

function appendSymbol(sym) {
  insertAtCursor(sym);
}

function insertRoot() {
  insertAtCursor('root( , )');
  const pos = display.value.indexOf('root( , )') + 5;
  display.setSelectionRange(pos, pos);
  display.focus();
}

function clearDisplay() {
  display.value = '';
  display.focus();
}

function backspace() {
  const start = display.selectionStart;
  const end = display.selectionEnd;
  if (start === end && start > 0) {
    display.value = display.value.slice(0, start - 1) + display.value.slice(end);
    display.setSelectionRange(start - 1, start - 1);
  } else {
    display.value = display.value.slice(0, start) + display.value.slice(end);
    display.setSelectionRange(start, start);
  }
  display.focus();
}

function factorial(n) {
  if (n < 0 || !Number.isInteger(n)) throw Error("Invalid factorial");
  return n <= 1 ? 1 : n * factorial(n - 1);
}

function nPr(n, r) {
  return factorial(n) / factorial(n - r);
}

function nCr(n, r) {
  return factorial(n) / (factorial(r) * factorial(n - r));
}

function isUndefinedTrig(fn, val) {
  if (angleMode === "deg") {
    if (fn === "tan") {
      const normalized = ((+val % 180) + 180) % 180; // 90, 270, etc.
      return normalized === 90;
    }
  } else {
    if (fn === "tan") {
      const cosVal = Math.cos(+val);
      return Math.abs(cosVal) < 1e-10;
    }
  }
  return false;
}

function evaluateTrigFunctions(expr) {
  const deg = angleMode === "deg";
  return expr.replace(/(sin|cos|tan|asin|acos|atan)\(([^()]+)\)/g, (_, fn, arg) => {
    const val = eval(arg);
    if (isUndefinedTrig(fn, val)) return "undefined";
    const trig = {
      sin: x => Math.sin(deg ? x * Math.PI / 180 : x),
      cos: x => Math.cos(deg ? x * Math.PI / 180 : x),
      tan: x => Math.tan(deg ? x * Math.PI / 180 : x),
      asin: x => deg ? Math.asin(x) * 180 / Math.PI : Math.asin(x),
      acos: x => deg ? Math.acos(x) * 180 / Math.PI : Math.acos(x),
      atan: x => deg ? Math.atan(x) * 180 / Math.PI : Math.atan(x),
    };
    return trig[fn](val);
  });
}

function evaluateFactorials(expr) {
  return expr.replace(/(\d+)!/g, (_, n) => factorial(+n));
}

function evaluateExponents(expr) {
  const expRE = /(\d+(?:\.\d+)?|\([^()]+\))\^(\d+(?:\.\d+)?|\([^()]+\))/;
  while (expRE.test(expr)) {
    expr = expr.replace(expRE, (_, base, exp) => Math.pow(eval(base), eval(exp)));
  }
  return expr;
}

function convertEtoExp(expr) {
  return expr.replace(/e\^\(([^()]+)\)/g, (_, inside) => `Math.exp(${inside})`);
}

function evaluateNthRoots(expr) {
  expr = expr.replace(/\\sqrt\[(\d+)\]\{([^{}]+)\}/g, (_, n, x) => Math.pow(+x, 1 / +n));
  expr = expr.replace(/root\(([^,]+),([^()]+)\)/g, (_, n, x) => Math.pow(+x, 1 / +n));
  expr = expr.replace(/(\d+)ⁿ√\(([^()]+)\)/g, (_, n, x) => Math.pow(+x, 1 / +n));
  return expr;
}

function evaluatePermutations(expr) {
  expr = expr.replace(/p\((\d+),(\d+)\)/g, (_, n, r) => nPr(+n, +r));
  expr = expr.replace(/c\((\d+),(\d+)\)/g, (_, n, r) => nCr(+n, +r));
  return expr;
}

function evaluateLn(expr) {
  return expr.replace(/ln\(([^)]+)\)/g, (_, x) => `Math.log(${x})`);
}

function evaluatePercent(expr) {
  return expr.replace(/(\d+(\.\d+)?)%/g, (_, num) => +num / 100);
}

function replaceSymbols(expr) {
  return expr.replace(/\u03C0/g, 'Math.PI')
             .replace(/\u221A\(/g, 'Math.sqrt(')
             .replace(/log\(/g, 'Math.log10(')
             .replace(/\u00F7/g, '/')
             .replace(/\u00D7/g, '*')
             .replace(/(?<![a-zA-Z])e(?![a-zA-Z^(])/g, 'Math.E'); // leaves e^( intact
}

function preprocess(expr) {
  expr = replaceSymbols(expr);
  expr = convertEtoExp(expr);
  expr = evaluatePercent(expr);
  expr = evaluateFactorials(expr);
  expr = evaluateLn(expr);
  expr = evaluatePermutations(expr);
  expr = evaluateTrigFunctions(expr);
  expr = evaluateNthRoots(expr);
  expr = evaluateExponents(expr);
  return expr;
}

function calculate() {
  try {
    const expr = preprocess(display.value);
    const result = eval(expr);
    if (!isFinite(result) || result === undefined || result === null || result === "undefined") {
      display.value = "undefined";
    } else {
      display.value = +parseFloat(result.toFixed(10));
    }
  } catch {
    display.value = "undefined";
  }
  setCursorToEnd(display);
}

function memoryAdd() {
  try {
    const val = eval(preprocess(display.value));
    if (!isFinite(val)) throw new Error();
    memory += val;
    display.value = '';
  } catch {
    display.value = "undefined";
  }
  setCursorToEnd(display);
}

function memorySubtract() {
  try {
    const val = eval(preprocess(display.value));
    if (!isFinite(val)) throw new Error();
    memory -= val;
    display.value = '';
  } catch {
    display.value = "undefined";
  }
  setCursorToEnd(display);
}

function memoryRecall() {
  append(memory.toString());
}

display.addEventListener('keydown', e => {
  const keys = '0123456789+-*/().^!eπ,% ';
  if (!keys.includes(e.key) && !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Enter'].includes(e.key)) {
    e.preventDefault();
  }
  if (e.key === 'Enter') {
    e.preventDefault();
    calculate();
  }
});

function toggleMode() {
  angleMode = angleMode === "deg" ? "rad" : "deg";
  modeButton.textContent = angleMode;
  setCursorToEnd(display);
}

const buttons = document.querySelectorAll("button");
buttons.forEach(btn => {
  btn.addEventListener("click", () => {
    btn.classList.add("active");
    setTimeout(() => btn.classList.remove("active"), 120);
  });
});
