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

  function fracHTML(n, d){
    return `<span class="frac"><sup>${n}</sup><span class="bar"></span><sub>${d}</sub></span>`;
  }

  function simplifyFraction(n, d){
    if (d === 0) return { html: "No definida", undef: true };

    const nR = Math.round(n);
    const dR = Math.round(d);
    const intish = Math.abs(n - nR) < 1e-10 && Math.abs(d - dR) < 1e-10;

    if (intish){
      const g = gcd(nR, dR);
      return { html: fracHTML(nR / g, dR / g), undef: false };
    }
    // si no son enteros "bonitos", mostramos como fracción con decimales
    return { html: fracHTML(formatDecimal(n), formatDecimal(d)), undef: false };
  }

  function pythagorasCheck(opp, adj, hyp){
    if (!(opp > 0 && adj > 0 && hyp > 0)) return { ok:false, msg:"Los lados deben ser positivos." };
    const lhs = opp*opp + adj*adj;
    const rhs = hyp*hyp;
    const tol = Math.max(1e-9, rhs * 1e-6);
    if (Math.abs(lhs - rhs) > tol){
      return { ok:false, msg:"No cumple Pitágoras (igual se calculará con los lados ingresados)." };
    }
    return { ok:true, msg:"Triángulo válido (Pitágoras OK)." };
  }

  // ===== Fórmulas (texto fijo) =====
  function renderFormulaBox(){
    const box = $("formulaBox");
    if (!box) return;

    box.innerHTML = `
      <div class="small" style="margin-bottom:10px;">
        Fórmulas en triángulo rectángulo (usando lados):
      </div>

      <table>
        <thead>
          <tr>
            <th>Razón</th>
            <th>Definición</th>
          </tr>
        </thead>
        <tbody>
          <tr><td class="op">seno (sen)</td><td class="mono">cateto opuesto / hipotenusa</td></tr>
          <tr><td class="op">coseno (cos)</td><td class="mono">cateto adyacente / hipotenusa</td></tr>
          <tr><td class="op">tangente (tan)</td><td class="mono">cateto opuesto / cateto adyacente</td></tr>
          <tr><td class="op">cotangente (cot)</td><td class="mono">cateto adyacente / cateto opuesto</td></tr>
          <tr><td class="op">secante (sec)</td><td class="mono">hipotenusa / cateto adyacente</td></tr>
          <tr><td class="op">cosecante (csc)</td><td class="mono">hipotenusa / cateto opuesto</td></tr>
        </tbody>
      </table>
    `;
  }

  // ===== Dibujo del triángulo (solo visual) =====
  function drawTriangle(opp, adj, hyp){
    const cv = $("triCanvas");
    const legend = $("triLegend");
    if (!cv) return;
    const ctx = cv.getContext("2d");
    const W = cv.width, H = cv.height;

    ctx.clearRect(0,0,W,H);

    // Fondo
    ctx.fillStyle = "rgba(255,255,255,0.02)";
    ctx.fillRect(0,0,W,H);

    // Si falta algo, dibuja el 3-4-5
    let a = adj, b = opp, c = hyp;
    if (!(a>0 && b>0 && c>0)){
      a = 4; b = 3; c = 5;
    }

    // Para geometría, usamos catetos. La hipotenusa del dibujo será sqrt(a^2+b^2)
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

    // Labels
    ctx.fillStyle = "rgba(238,242,255,0.92)";
    ctx.font = "18px system-ui, -apple-system, Segoe UI, Roboto, Arial";

    ctx.fillText(`cateto adyacente = ${formatDecimal(a)}`, (x1 + x2)/2 - 120, y1 + 32);
    ctx.fillText(`cateto opuesto = ${formatDecimal(b)}`, x1 - 155, (y1 + y3)/2);
    ctx.fillText(`hipotenusa ≈ ${formatDecimal(cPlot)}`, (x2 + x3)/2 + 12, (y2 + y3)/2 - 12);

    if (legend){
      legend.innerHTML =
        `Lados ingresados: opuesto=${formatDecimal(b)}, adyacente=${formatDecimal(a)}, hipotenusa=${formatDecimal(c)}. ` +
        `<span class="muted">(Dibujo usa hipotenusa ≈ ${formatDecimal(cPlot)})</span>`;
    }
  }

  // ===== Resultados por lados =====
  function buildRow(title, fracObj, dec){
    if (fracObj.undef || !isFinite(dec)){
      return `
        <tr>
          <td class="op">${title}</td>
          <td><div class="val"><span class="undef">No definida</span><div class="muted mono">∞</div></div></td>
        </tr>
      `;
    }
    return `
      <tr>
        <td class="op">${title}</td>
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

    if (opp == null || adj == null || hyp == null){
      if (sideStatus) sideStatus.innerHTML = `<span class="bad">Completa cateto opuesto, cateto adyacente e hipotenusa.</span>`;
      return;
    }

    const chk = pythagorasCheck(opp, adj, hyp);
    if (sideStatus){
      sideStatus.innerHTML = chk.ok
        ? `<span class="ok">✔ ${chk.msg}</span>`
        : `<span class="warn">⚠ ${chk.msg}</span>`;
    }

    // Razones (solo por lados)
    const sinV = hyp === 0 ? Infinity : opp / hyp;
    const cosV = hyp === 0 ? Infinity : adj / hyp;
    const tanV = adj === 0 ? Infinity : opp / adj;

    const cotV = opp === 0 ? Infinity : adj / opp;
    const secV = adj === 0 ? Infinity : hyp / adj;
    const cscV = opp === 0 ? Infinity : hyp / opp;

    const sinF = simplifyFraction(opp, hyp);
    const cosF = simplifyFraction(adj, hyp);
    const tanF = simplifyFraction(opp, adj);
    const cotF = simplifyFraction(adj, opp);
    const secF = simplifyFraction(hyp, adj);
    const cscF = simplifyFraction(hyp, opp);

    const tableHTML = `
      <div class="mono" style="margin-bottom:10px">
        Resultados (calculados solo con lados)
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
            ${buildRow("sen = opuesto / hipotenusa", sinF, sinV)}
            ${buildRow("cos = adyacente / hipotenusa", cosF, cosV)}
            ${buildRow("tan = opuesto / adyacente", tanF, tanV)}
            ${buildRow("cot = adyacente / opuesto", cotF, cotV)}
            ${buildRow("sec = hipotenusa / adyacente", secF, secV)}
            ${buildRow("csc = hipotenusa / opuesto", cscF, cscV)}
          </tbody>
        </table>
      </div>
    `;

    if (outA) outA.innerHTML = tableHTML;

    if (outB) outB.innerHTML = `
      <div class="mono" style="margin-bottom:10px">Datos del triángulo</div>
      <div class="kpi">
        <div class="chip">Opuesto: <span class="mono">${formatDecimal(opp)}</span></div>
        <div class="chip">Adyacente: <span class="mono">${formatDecimal(adj)}</span></div>
        <div class="chip">Hipotenusa: <span class="mono">${formatDecimal(hyp)}</span></div>
      </div>
    `;

    drawTriangle(opp, adj, hyp);
  }

  function clearSides(){
    if ($("sideOpp")) $("sideOpp").value = "";
    if ($("sideAdj")) $("sideAdj").value = "";
    if ($("sideHyp")) $("sideHyp").value = "";
    if ($("sideStatus")) $("sideStatus").innerHTML = "";
    if ($("outA")) $("outA").innerHTML = "";
    if ($("outB")) $("outB").innerHTML = "";
    drawTriangle(null, null, null);
  }

  function init(){
    // Mensaje: ángulos no afectan
    const status = $("status");
    if (status){
      status.innerHTML = `<span class="warn">Los ángulos NO se usan. Este módulo calcula solo por lados.</span>`;
    }

    // Botones originales: que NO hagan cálculo por ángulo, solo por lados
    $("calc")?.addEventListener("click", (e) => { e.preventDefault(); calculateBySides(); });
    $("swap")?.addEventListener("click", (e) => {
      e.preventDefault();
      // swap SOLO visual
      const a = $("a"), b = $("b");
      if (a && b){ const tmp = a.value; a.value = b.value; b.value = tmp; }
    });
    $("clear")?.addEventListener("click", (e) => {
      e.preventDefault();
      if ($("a")) $("a").value = "";
      if ($("b")) $("b").value = "";
      clearSides();
    });

    // Botones nuevos
    $("calcSides")?.addEventListener("click", calculateBySides);
    $("clearSides")?.addEventListener("click", clearSides);

    // Enter en lados recalcula
    ["sideOpp","sideAdj","sideHyp"].forEach(id => {
      $(id)?.addEventListener("keydown", (e) => { if (e.key === "Enter") calculateBySides(); });
      $(id)?.addEventListener("change", calculateBySides);
    });

    // Inicial
    renderFormulaBox();
    drawTriangle(null, null, null);
  }

  document.addEventListener("DOMContentLoaded", init);
})();
