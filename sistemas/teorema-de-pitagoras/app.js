(() => {
  const el = (id) => document.getElementById(id);

  // Elements
  const modeEl = el("mode");
  const aEl = el("a");
  const bEl = el("b");
  const cEl = el("c");
  const decimalsEl = el("decimals");

  const showRadicalEl = el("showRadical");
  const showDecimalEl = el("showDecimal");
  const showStepsEl = el("showSteps");

  const errorEl = el("error");
  const resultHintEl = el("resultHint");
  const resultValueEl = el("resultValue");
  const checkValueEl = el("checkValue");

  const legendEl = el("legend");
  const stepsBoxEl = el("stepsBox");
  const stepsListEl = el("stepsList");
  const stepsNoteEl = el("stepsNote");

  const cv = el("cv");
  const ctx = cv?.getContext("2d");

  const sq = (x) => x * x;

  function simplifySqrtInt(n){
    if (!Number.isInteger(n) || n < 0) return null;
    if (n === 0) return { outside: 0, inside: 1 };

    let outside = 1, inside = n;
    for (let p = 2; p * p <= inside; p++){
      while (inside % (p*p) === 0){
        outside *= p;
        inside /= (p*p);
      }
    }
    return { outside, inside };
  }

  function formatDecimal(x){
    const d = parseInt(decimalsEl?.value || "4", 10);
    return Number(x).toFixed(d);
  }

  function showError(msg){
    if (!errorEl) return;
    errorEl.style.display = "block";
    errorEl.textContent = msg;
  }

  function clearError(){
    if (!errorEl) return;
    errorEl.style.display = "none";
    errorEl.textContent = "";
  }

  function readVal(input){
    if (!input) return null;
    const v = input.value.trim();
    if (v === "") return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }

  // ===== MathML helpers =====
  function mml(exprBody){
    return `<math xmlns="http://www.w3.org/1998/Math/MathML" display="inline">${exprBody}</math>`;
  }
  const mi = (x) => `<mi>${x}</mi>`;
  const mn = (x) => `<mn>${x}</mn>`;
  const mo = (x) => `<mo>${x}</mo>`;
  const mrow = (...xs) => `<mrow>${xs.join("")}</mrow>`;
  const msup = (base, exp) => `<msup>${base}${exp}</msup>`;
  const msqrt = (inside) => `<msqrt>${inside}</msqrt>`;

  const pow2 = (sym) => msup(mi(sym), mn("2"));

  function radicalExactString(rad){
    const near = Math.round(rad);
    if (Math.abs(rad - near) < 1e-10 && Number.isFinite(near) && near >= 0){
      const simp = simplifySqrtInt(near);
      if (!simp) return `√(${near})`;
      if (simp.outside === 0) return `0`;
      if (simp.inside === 1) return `${simp.outside}`;
      if (simp.outside === 1) return `√${simp.inside}`;
      return `${simp.outside}√${simp.inside}`;
    }
    return `√(${rad})`;
  }

  function radicalExactMathML(rad){
    const near = Math.round(rad);
    if (Math.abs(rad - near) < 1e-10 && Number.isFinite(near) && near >= 0){
      const simp = simplifySqrtInt(near);
      if (!simp) return mml(msqrt(mn(String(near))));
      if (simp.outside === 0) return mml(mn("0"));
      if (simp.inside === 1) return mml(mn(String(simp.outside)));
      if (simp.outside === 1) return mml(msqrt(mn(String(simp.inside))));
      return mml(mrow(mn(String(simp.outside)), mo("×"), msqrt(mn(String(simp.inside)))));
    }
    return mml(msqrt(mn(String(rad))));
  }

  function buildResultBlock(label, exactStr, decVal){
    const parts = [];
    if (showRadicalEl?.checked) parts.push(`Exacta: ${exactStr}`);
    if (showDecimalEl?.checked) parts.push(`Decimal: ${formatDecimal(decVal)}`);
    return {
      hint: label,
      value: parts.length ? parts.join("\n") : "Activa al menos una opción (raíz o decimal)."
    };
  }

  function setSteps(steps, note=""){
    const show = !!showStepsEl?.checked;
    if (!stepsBoxEl || !stepsListEl || !stepsNoteEl) return;

    stepsBoxEl.style.display = show ? "block" : "none";
    stepsListEl.innerHTML = "";
    stepsNoteEl.textContent = "";
    if (!show) return;

    for (const html of steps){
      const li = document.createElement("li");
      li.innerHTML = html;
      stepsListEl.appendChild(li);
    }
    if (note) stepsNoteEl.textContent = note;
  }

  function setInputsForMode(){
    const mode = modeEl?.value || "hyp";

    if (mode === "hyp"){
      aEl.disabled = false; bEl.disabled = false; cEl.disabled = true;
      cEl.value = ""; cEl.placeholder = "Se calcula";
      aEl.placeholder = "Ej: 3"; bEl.placeholder = "Ej: 4";
    } else if (mode === "catA"){
      aEl.disabled = true; aEl.value = ""; aEl.placeholder = "Se calcula";
      bEl.disabled = false; cEl.disabled = false;
      bEl.placeholder = "Ej: 4"; cEl.placeholder = "Ej: 5";
    } else {
      bEl.disabled = true; bEl.value = ""; bEl.placeholder = "Se calcula";
      aEl.disabled = false; cEl.disabled = false;
      aEl.placeholder = "Ej: 3"; cEl.placeholder = "Ej: 5";
    }

    drawTriangle();
    setSteps([]);
  }

  function calculate(){
    clearError();

    const mode = modeEl?.value || "hyp";
    const a = readVal(aEl);
    const b = readVal(bEl);
    const c = readVal(cEl);

    let res = null;
    let knownA = a, knownB = b, knownC = c;
    const steps = [];

    if (mode === "hyp"){
      if (a == null || b == null) return showError("Para calcular la hipotenusa, ingresa a y b.");
      if (a <= 0 || b <= 0) return showError("Los catetos deben ser positivos.");

      steps.push(`Fórmula de Pitágoras: ${mml(mrow(pow2("c"), mo("="), pow2("a"), mo("+"), pow2("b")))}`);
      steps.push(`Despejamos ${mml(mi("c"))}: ${mml(mrow(mi("c"), mo("="), msqrt(mrow(pow2("a"), mo("+"), pow2("b")))))}`);
      steps.push(`Sustituimos: ${mml(mrow(mi("c"), mo("="), msqrt(mrow(msup(mn(String(a)), mn("2")), mo("+"), msup(mn(String(b)), mn("2"))))))}`);
      steps.push(`Calculamos cuadrados: ${mml(mrow(mi("c"), mo("="), msqrt(mrow(mn(String(sq(a))), mo("+"), mn(String(sq(b)))))))}`);

      const rad = sq(a) + sq(b);
      steps.push(`Sumamos: ${mml(mrow(mi("c"), mo("="), msqrt(mn(String(rad)))))}`);

      const val = Math.sqrt(rad);
      const exactStr = radicalExactString(rad);
      const exactMml = radicalExactMathML(rad);

      steps.push(`Resultado exacto: ${mml(mrow(mi("c"), mo("=")))} ${exactMml}`);
      steps.push(`Aproximación: ${mml(mrow(mi("c"), mo("≈"), mn(formatDecimal(val))))}`);

      res = { which:"c", value: val, exactStr, steps };
      knownC = val;

    } else if (mode === "catA"){
      if (c == null || b == null) return showError("Para calcular el cateto a, ingresa c y b.");
      if (c <= 0 || b <= 0) return showError("Usa valores positivos.");
      if (c <= b) return showError("Debe cumplirse c > b para que el cateto sea real.");

      steps.push(`Fórmula: ${mml(mrow(pow2("c"), mo("="), pow2("a"), mo("+"), pow2("b")))}`);
      steps.push(`Despejamos ${mml(pow2("a"))}: ${mml(mrow(pow2("a"), mo("="), pow2("c"), mo("−"), pow2("b")))}`);
      steps.push(`Luego: ${mml(mrow(mi("a"), mo("="), msqrt(mrow(pow2("c"), mo("−"), pow2("b")))))}`);
      steps.push(`Sustituimos: ${mml(mrow(mi("a"), mo("="), msqrt(mrow(msup(mn(String(c)), mn("2")), mo("−"), msup(mn(String(b)), mn("2"))))))}`);
      steps.push(`Cuadrados: ${mml(mrow(mi("a"), mo("="), msqrt(mrow(mn(String(sq(c))), mo("−"), mn(String(sq(b)))))))}`);

      const rad = sq(c) - sq(b);
      steps.push(`Restamos: ${mml(mrow(mi("a"), mo("="), msqrt(mn(String(rad)))))}`);
      if (rad < 0) return showError("No hay solución real: c² − b² es negativo.");

      const val = Math.sqrt(rad);
      const exactStr = radicalExactString(rad);
      const exactMml = radicalExactMathML(rad);

      steps.push(`Resultado exacto: ${mml(mrow(mi("a"), mo("=")))} ${exactMml}`);
      steps.push(`Aproximación: ${mml(mrow(mi("a"), mo("≈"), mn(formatDecimal(val))))}`);

      res = { which:"a", value: val, exactStr, steps };
      knownA = val;

    } else { // catB
      if (c == null || a == null) return showError("Para calcular el cateto b, ingresa c y a.");
      if (c <= 0 || a <= 0) return showError("Usa valores positivos.");
      if (c <= a) return showError("Debe cumplirse c > a para que el cateto sea real.");

      steps.push(`Fórmula: ${mml(mrow(pow2("c"), mo("="), pow2("a"), mo("+"), pow2("b")))}`);
      steps.push(`Despejamos ${mml(pow2("b"))}: ${mml(mrow(pow2("b"), mo("="), pow2("c"), mo("−"), pow2("a")))}`);
      steps.push(`Luego: ${mml(mrow(mi("b"), mo("="), msqrt(mrow(pow2("c"), mo("−"), pow2("a")))))}`);
      steps.push(`Sustituimos: ${mml(mrow(mi("b"), mo("="), msqrt(mrow(msup(mn(String(c)), mn("2")), mo("−"), msup(mn(String(a)), mn("2"))))))}`);
      steps.push(`Cuadrados: ${mml(mrow(mi("b"), mo("="), msqrt(mrow(mn(String(sq(c))), mo("−"), mn(String(sq(a)))))))}`);

      const rad = sq(c) - sq(a);
      steps.push(`Restamos: ${mml(mrow(mi("b"), mo("="), msqrt(mn(String(rad)))))}`);
      if (rad < 0) return showError("No hay solución real: c² − a² es negativo.");

      const val = Math.sqrt(rad);
      const exactStr = radicalExactString(rad);
      const exactMml = radicalExactMathML(rad);

      steps.push(`Resultado exacto: ${mml(mrow(mi("b"), mo("=")))} ${exactMml}`);
      steps.push(`Aproximación: ${mml(mrow(mi("b"), mo("≈"), mn(formatDecimal(val))))}`);

      res = { which:"b", value: val, exactStr, steps };
      knownB = val;
    }

    if (!res) return;

    if (res.which === "a") aEl.value = String(res.value);
    if (res.which === "b") bEl.value = String(res.value);
    if (res.which === "c") cEl.value = String(res.value);

    const label = res.which === "c" ? "Hipotenusa (c)" : (res.which === "a" ? "Cateto (a)" : "Cateto (b)");
    const out = buildResultBlock(label, res.exactStr, res.value);

    if (resultHintEl) resultHintEl.textContent = out.hint;
    if (resultValueEl) resultValueEl.textContent = out.value;

    const A = knownA ?? 0;
    const B = knownB ?? 0;
    const C = knownC ?? 0;

    if (A>0 && B>0 && C>0){
      const lhs = A*A + B*B;
      const rhs = C*C;

      if (checkValueEl){
        checkValueEl.textContent =
          `a² + b² = ${formatDecimal(lhs)}\n` +
          `c²      = ${formatDecimal(rhs)}\n` +
          `Diferencia = ${formatDecimal(Math.abs(lhs - rhs))}`;
      }

      setSteps(res.steps, "Tip: si la diferencia es muy pequeña, está bien (por redondeo).");
    } else {
      if (checkValueEl) checkValueEl.textContent = "Ingresa (o calcula) a, b y c para comprobar.";
      setSteps(res.steps, "Completa los otros lados para ver la comprobación completa.");
    }

    drawTriangle();
  }

  function clearAll(){
    aEl.value = ""; bEl.value = ""; cEl.value = "";
    if (resultHintEl) resultHintEl.textContent = "—";
    if (resultValueEl) resultValueEl.textContent = "—";
    if (checkValueEl) checkValueEl.textContent = "—";
    if (legendEl) legendEl.textContent = "—";
    clearError();
    setSteps([]);
    drawTriangle();
  }

  function swapAB(){
    const tmp = aEl.value;
    aEl.value = bEl.value;
    bEl.value = tmp;
    drawTriangle();
  }

  function drawTriangle(){
    if (!cv || !ctx) return;

    const a = readVal(aEl);
    const b = readVal(bEl);
    const c = readVal(cEl);

    let A = (a != null && a > 0) ? a : null;
    let B = (b != null && b > 0) ? b : null;
    let C = (c != null && c > 0) ? c : null;

    if (A != null && B != null){
      C = Math.sqrt(A*A + B*B);
    } else if (C != null && A != null && C > A){
      B = Math.sqrt(Math.max(0, C*C - A*A));
    } else if (C != null && B != null && C > B){
      A = Math.sqrt(Math.max(0, C*C - B*B));
    }

    if (A == null) A = 3;
    if (B == null) B = 4;
    if (C == null) C = 5;

    const W = cv.width, H = cv.height;
    ctx.clearRect(0,0,W,H);

    const pad = 70;
    const maxX = W - pad*2;
    const maxY = H - pad*2;
    const scale = Math.min(maxX / A, maxY / B);

    const ox = pad + 40;
    const oy = H - pad;

    const x1 = ox, y1 = oy;
    const x2 = ox + A*scale, y2 = oy;
    const x3 = ox, y3 = oy - B*scale;

    ctx.fillStyle = "rgba(15,23,42,0.03)";
    ctx.fillRect(0,0,W,H);

    ctx.strokeStyle = "rgba(15,23,42,0.14)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(ox, oy); ctx.lineTo(ox + maxX, oy);
    ctx.moveTo(ox, oy); ctx.lineTo(ox, oy - maxY);
    ctx.stroke();

    ctx.strokeStyle = "rgba(47,108,246,0.95)";
    ctx.lineWidth = 4;
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(x1,y1);
    ctx.lineTo(x2,y2);
    ctx.lineTo(x3,y3);
    ctx.closePath();
    ctx.stroke();

    const s = 26;
    ctx.strokeStyle = "rgba(11,18,32,0.55)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x1 + s, y1);
    ctx.lineTo(x1 + s, y1 - s);
    ctx.lineTo(x1, y1 - s);
    ctx.stroke();

    ctx.fillStyle = "rgba(11,18,32,0.90)";
    ctx.font = "16px system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif";

    ctx.fillText(`a = ${formatDecimal(A)}`, (x1 + x2)/2 - 30, y1 + 28);
    ctx.fillText(`b = ${formatDecimal(B)}`, x1 - 60, (y1 + y3)/2);
    ctx.fillText(`c = ${formatDecimal(C)}`, (x2 + x3)/2 + 10, (y2 + y3)/2 - 10);

    if (legendEl){
      legendEl.textContent = `Valores para el dibujo: a=${formatDecimal(A)}, b=${formatDecimal(B)}, c=${formatDecimal(C)}.`;
    }
  }

  function safeAddListener(node, evt, fn){
    if (!node) return;
    node.addEventListener(evt, fn);
  }

  function init(){
    // Eventos
    safeAddListener(el("btnCalc"), "click", calculate);
    safeAddListener(el("btnClear"), "click", clearAll);
    safeAddListener(el("btnSwap"), "click", swapAB);
    safeAddListener(modeEl, "change", setInputsForMode);

    [showRadicalEl, showDecimalEl, decimalsEl].forEach(x => {
      safeAddListener(x, "change", () => {
        drawTriangle();
        try { calculate(); } catch {}
      });
    });

    safeAddListener(showStepsEl, "change", () => {
      if (stepsBoxEl) stepsBoxEl.style.display = showStepsEl.checked ? "block" : "none";
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Enter") calculate();
      if (e.key === "Escape") clearAll();
    });

    setInputsForMode();
    drawTriangle();
  }

  document.addEventListener("DOMContentLoaded", init);
})();
