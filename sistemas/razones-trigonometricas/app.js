(() => {
  const $ = (id) => document.getElementById(id);

  // ===== Helpers =====
  function cleanNumber(x){
    if (!isFinite(x)) return x;
    if (Math.abs(x) < 5e-16) return 0;
    return x;
  }

  function formatDecimal(x){
    if (!isFinite(x)) return "No definida";
    x = cleanNumber(x);
    let s = x.toFixed(10);
    s = s.replace(/\.?0+$/,'');
    return s;
  }

  function parseNum(v){
    if (v === "" || v == null) return null;
    const n = Number(v);
    return isFinite(n) ? n : null;
  }

  function gcd(a,b){
    a = Math.abs(a); b = Math.abs(b);
    while (b) { const t = b; b = a % b; a = t; }
    return a || 1;
  }

  // Fracción bonita: numerador arriba, barra, denominador abajo
  function fracHTML(n, d){
    return `<span class="frac"><sup>${n}</sup><span class="bar"></span><sub>${d}</sub></span>`;
  }

  function simplifyFraction(n, d){
    if (d === 0) return { html: `<span class="undef">No definida</span>`, undef: true };

    const nR = Math.round(n);
    const dR = Math.round(d);
    const intish = Math.abs(n - nR) < 1e-10 && Math.abs(d - dR) < 1e-10;

    if (intish){
      const g = gcd(nR, dR);
      return { html: fracHTML(nR / g, dR / g), undef: false };
    }
    // si no son enteros, fracción con decimales (igual con barra bonita)
    return { html: fracHTML(formatDecimal(n), formatDecimal(d)), undef: false };
  }

  function pythagorasCheck(opp, adj, hyp){
    if (!(opp > 0 && adj > 0 && hyp > 0)) return { ok:false, msg:"Los lados deben ser positivos." };
    const lhs = opp*opp + adj*adj;
    const rhs = hyp*hyp;
    const tol = Math.max(1e-9, rhs * 1e-6);
    if (Math.abs(lhs - rhs) > tol){
      return { ok:false, msg:"No cumple Pitágoras (igual se calcula con los lados ingresados)." };
    }
    return { ok:true, msg:"Triángulo válido (Pitágoras OK)." };
  }

  // ===== Etiquetas según ángulos (SOLO VISTA) =====
  function angleLabel(value, fallbackLetter){
    const n = parseNum(value);
    if (n == null) return fallbackLetter;       // A o B
    return `${formatDecimal(n)}°`;              // 37°
  }

  function fnLabel(fn, angleText){
    // fn: sen, cos, tan, cot, sec, csc
    // angleText: "37°" o "A"
    return `${fn}(${angleText})`;
  }

  // ===== Fórmulas (texto fijo) =====
  function renderFormulaBox(){
    const box = $("formulaBox");
    if (!box) return;

    box.innerHTML = `
      <div class="small" style="margin-bottom:10px;">
        Definiciones en triángulo rectángulo (usando lados):
      </div>

      <table>
        <thead>
          <tr>
            <th>Razón</th>
            <th>Definición (con fracción)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td class="op">seno (sen)</td>
            <td class="val">${fracHTML("cateto opuesto", "hipotenusa")}</td>
          </tr>
          <tr>
            <td class="op">coseno (cos)</td>
            <td class="val">${fracHTML("cateto adyacente", "hipotenusa")}</td>
          </tr>
          <tr>
            <td class="op">tangente (tan)</td>
            <td class="val">${fracHTML("cateto opuesto", "cateto adyacente")}</td>
          </tr>
          <tr>
            <td class="op">cotangente (cot)</td>
            <td class="val">${fracHTML("cateto adyacente", "cateto opuesto")}</td>
          </tr>
          <tr>
            <td class="op">secante (sec)</td>
            <td class="val">${fracHTML("hipotenusa", "cateto adyacente")}</td>
          </tr>
          <tr>
            <td class="op">cosecante (csc)</td>
            <td class="val">${fracHTML("hipotenusa", "cateto opuesto")}</td>
          </tr>
        </tbody>
      </table>
    `;
  }

  // ===== Dibujo (visual). Usa lados y muestra A/B solo como texto =====
  function drawTriangle(opp, adj, hyp, Atext, Btext){
    const cv = $("triCanvas");
    const legend = $("triLegend");
    if (!cv) return;
    const ctx = cv.getContext("2d");
    const W = cv.width, H = cv.height;

    ctx.clearRect(0,0,W,H);
    ctx.fillStyle = "rgba(255,255,255,0.02)";
    ctx.fillRect(0,0,W,H);

    let a = adj, b = opp, c = hyp;
    if (!(a>0 && b>0 && c>0)){
      a = 4; b = 3; c = 5;
    }

    const cPlot = Math.sqrt(a*a + b*b);

    const pad = 70;
    const maxX = W - pad*2;
    const maxY = H - pad*2;
    const scale = Math.min(maxX / a, maxY / b);

    const ox = pad + 40;
    const oy = H - pad;

    const x1 = ox, y1 = oy;
    const x2 = ox + a*scale, y2 = oy;
    const x3 = ox, y3 = oy - b*scale;

    // Ejes
    ctx.strokeStyle = "rgba(255,255,255,0.10)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(ox, oy); ctx.lineTo(ox + maxX, oy);
    ctx.moveTo(ox, oy); ctx.lineTo(ox, oy - maxY);
    ctx.stroke();

    // Triángulo
    ctx.strokeStyle = "rgba(122,162,255,0.95)";
    ctx.lineWidth = 4;
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(x1,y1);
    ctx.lineTo(x2,y2);
    ctx.lineTo(x3,y3);
    ctx.closePath();
    ctx.stroke();

    // ángulo recto
    const s = 26;
    ctx.strokeStyle = "rgba(238,242,255,0.75)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x1 + s, y1);
    ctx.lineTo(x1 + s, y1 - s);
    ctx.lineTo(x1, y1 - s);
    ctx.stroke();

    // Labels lados
    ctx.fillStyle = "rgba(238,242,255,0.92)";
    ctx.font = "18px system-ui, -apple-system, Segoe UI, Roboto, Arial";

    ctx.fillText(`adyacente = ${formatDecimal(a)}`, (x1 + x2)/2 - 95, y1 + 32);
    ctx.fillText(`opuesto = ${formatDecimal(b)}`, x1 - 110, (y1 + y3)/2);
    ctx.fillText(`hipotenusa ≈ ${formatDecimal(cPlot)}`, (x2 + x3)/2 + 12, (y2 + y3)/2 - 12);

    // Texto de ángulos SOLO VISUAL (no afecta cálculos)
    ctx.font = "17px system-ui, -apple-system, Segoe UI, Roboto, Arial";
    ctx.fillText(`∠A = ${Atext}`, x2 - 120, y2 - 18);
    ctx.fillText(`∠B = ${Btext}`, x3 + 10, y3 + 30);

    if (legend){
      legend.innerHTML =
        `Visual: ∠A=${Atext}, ∠B=${Btext}. ` +
        `Cálculo por lados: opuesto=${formatDecimal(b)}, adyacente=${formatDecimal(a)}, hipotenusa=${formatDecimal(c)}.`;
    }
  }

  function buildRow(labelLeft, fracObj, dec){
    if (fracObj.undef || !isFinite(dec)){
      return `
        <tr>
          <td class="op">${labelLeft}</td>
          <td><div class="val"><span class="undef">No definida</span><div class="muted mono">∞</div></div></td>
        </tr>
      `;
    }
    return `
      <tr>
        <td class="op">${labelLeft}</td>
        <td>
          <div class="val">
            <span class="exact">Fracción</span>
            <div>${fracObj.html}</div>
            <div class="muted mono">≈ ${formatDecimal(dec)}</div>
          </div>
        </td>
      </tr>
    `;
  }

  function calculateBySides(){
    const opp = parseNum($("sideOpp")?.value);
    const adj = parseNum($("sideAdj")?.value);
    const hyp = parseNum($("sideHyp")?.value);

    const sideStatus = $("sideStatus");
    const outA = $("outA");
    const outB = $("outB");

    // Etiquetas de ángulo SOLO VISUAL
    const Atext = angleLabel($("a")?.value, "A");
    const Btext = angleLabel($("b")?.value, "B");

    if (opp == null || adj == null || hyp == null){
      if (sideStatus) sideStatus.innerHTML = `<span class="bad">Completa cateto opuesto, cateto adyacente e hipotenusa.</span>`;
      drawTriangle(null, null, null, Atext, Btext);
      return;
    }

    const chk = pythagorasCheck(opp, adj, hyp);
    if (sideStatus){
      sideStatus.innerHTML = chk.ok
        ? `<span class="ok">✔ ${chk.msg}</span>`
        : `<span class="warn">⚠ ${chk.msg}</span>`;
    }

    // Para A (definición): opuesto=opp, adyacente=adj
    const sinA = hyp === 0 ? Infinity : opp / hyp;
    const cosA = hyp === 0 ? Infinity : adj / hyp;
    const tanA = adj === 0 ? Infinity : opp / adj;
    const cotA = opp === 0 ? Infinity : adj / opp;
    const secA = adj === 0 ? Infinity : hyp / adj;
    const cscA = opp === 0 ? Infinity : hyp / opp;

    // Para B (se invierten catetos): opuesto=adj, adyacente=opp
    const sinB = hyp === 0 ? Infinity : adj / hyp;
    const cosB = hyp === 0 ? Infinity : opp / hyp;
    const tanB = opp === 0 ? Infinity : adj / opp;
    const cotB = adj === 0 ? Infinity : opp / adj;
    const secB = opp === 0 ? Infinity : hyp / opp;
    const cscB = adj === 0 ? Infinity : hyp / adj;

    // Fracciones bonitas
    const sinAf = simplifyFraction(opp, hyp);
    const cosAf = simplifyFraction(adj, hyp);
    const tanAf = simplifyFraction(opp, adj);
    const cotAf = simplifyFraction(adj, opp);
    const secAf = simplifyFraction(hyp, adj);
    const cscAf = simplifyFraction(hyp, opp);

    const sinBf = simplifyFraction(adj, hyp);
    const cosBf = simplifyFraction(opp, hyp);
    const tanBf = simplifyFraction(adj, opp);
    const cotBf = simplifyFraction(opp, adj);
    const secBf = simplifyFraction(hyp, opp);
    const cscBf = simplifyFraction(hyp, adj);

    // Tabla para A
    const tableA = `
      <div class="mono" style="margin-bottom:10px">
        Resultados para A (solo etiqueta, cálculo por lados)
      </div>
      <div class="tableWrap">
        <table>
          <thead>
            <tr>
              <th>Razón</th>
              <th>Valor (fracción y decimal)</th>
            </tr>
          </thead>
          <tbody>
            ${buildRow(fnLabel("sen", Atext), sinAf, sinA)}
            ${buildRow(fnLabel("cos", Atext), cosAf, cosA)}
            ${buildRow(fnLabel("tan", Atext), tanAf, tanA)}
            ${buildRow(fnLabel("cot", Atext), cotAf, cotA)}
            ${buildRow(fnLabel("sec", Atext), secAf, secA)}
            ${buildRow(fnLabel("csc", Atext), cscAf, cscA)}
          </tbody>
        </table>
      </div>
    `;

    // Tabla para B
    const tableB = `
      <div class="mono" style="margin-bottom:10px">
        Resultados para B (solo etiqueta, cálculo por lados)
      </div>
      <div class="tableWrap">
        <table>
          <thead>
            <tr>
              <th>Razón</th>
              <th>Valor (fracción y decimal)</th>
            </tr>
          </thead>
          <tbody>
            ${buildRow(fnLabel("sen", Btext), sinBf, sinB)}
            ${buildRow(fnLabel("cos", Btext), cosBf, cosB)}
            ${buildRow(fnLabel("tan", Btext), tanBf, tanB)}
            ${buildRow(fnLabel("cot", Btext), cotBf, cotB)}
            ${buildRow(fnLabel("sec", Btext), secBf, secB)}
            ${buildRow(fnLabel("csc", Btext), cscBf, cscB)}
          </tbody>
        </table>
      </div>
    `;

    if (outA) outA.innerHTML = tableA;
    if (outB) outB.innerHTML = tableB;

    drawTriangle(opp, adj, hyp, Atext, Btext);
  }

  function clearAll(){
    // No tocar ángulos (son vista), solo limpiar lados + resultados
    if ($("sideOpp")) $("sideOpp").value = "";
    if ($("sideAdj")) $("sideAdj").value = "";
    if ($("sideHyp")) $("sideHyp").value = "";
    if ($("sideStatus")) $("sideStatus").innerHTML = "";
    if ($("outA")) $("outA").innerHTML = "";
    if ($("outB")) $("outB").innerHTML = "";
    const Atext = angleLabel($("a")?.value, "A");
    const Btext = angleLabel($("b")?.value, "B");
    drawTriangle(null, null, null, Atext, Btext);
  }

  function init(){
    // Mensaje claro
    const status = $("status");
    if (status){
      status.innerHTML = `<span class="warn">Los ángulos NO se usan para calcular. Solo son etiqueta/visual. El cálculo es por lados.</span>`;
    }

    // Botones originales: que recalculen por lados
    $("calc")?.addEventListener("click", (e) => { e.preventDefault(); calculateBySides(); });
    $("swap")?.addEventListener("click", (e) => {
      e.preventDefault();
      // swap SOLO visual
      const a = $("a"), b = $("b");
      if (a && b){ const tmp = a.value; a.value = b.value; b.value = tmp; }
      calculateBySides();
    });
    $("clear")?.addEventListener("click", (e) => { e.preventDefault(); clearAll(); });

    // Botones lados
    $("calcSides")?.addEventListener("click", calculateBySides);
    $("clearSides")?.addEventListener("click", clearAll);

    // Cambiar lados recalcula
    ["sideOpp","sideAdj","sideHyp","a","b"].forEach(id => {
      $(id)?.addEventListener("change", calculateBySides);
      $(id)?.addEventListener("keydown", (e) => { if (e.key === "Enter") calculateBySides(); });
    });

    renderFormulaBox();
    calculateBySides(); // dibuja y prepara vista
  }

  document.addEventListener("DOMContentLoaded", init);
})();
