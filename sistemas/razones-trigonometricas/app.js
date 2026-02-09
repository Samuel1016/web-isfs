(() => {
  const $ = (id) => document.getElementById(id);

  // Helpers
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

  function gcd(a,b){
    a = Math.abs(a); b = Math.abs(b);
    while (b) { const t = b; b = a % b; a = t; }
    return a || 1;
  }

  function parseNum(v){
    if (v === "" || v == null) return null;
    const n = Number(v);
    return isFinite(n) ? n : null;
  }

  function fracHTML(n, d){
    return `<span class="frac"><sup>${n}</sup><span class="bar"></span><sub>${d}</sub></span>`;
  }

  function simplifyFraction(n, d){
    // Manejo de indefiniciones
    if (d === 0) return { html: "No definida", kind: "undef" };

    const nR = Math.round(n);
    const dR = Math.round(d);
    const intish = Math.abs(n - nR) < 1e-10 && Math.abs(d - dR) < 1e-10;

    if (intish){
      const g = gcd(nR, dR);
      return { html: fracHTML(nR / g, dR / g), kind: "frac" };
    }
    // si no son enteros “bonitos”, mostramos decimal solamente
    return { html: fracHTML(formatDecimal(n), formatDecimal(d)), kind: "approxFrac" };
  }

  function isValidTriangle(opp, adj, hyp){
    if (!(opp > 0 && adj > 0 && hyp > 0)) {
      return { ok:false, msg:"Los lados deben ser positivos." };
    }
    // Validación pitagórica (opcional, pero recomendada)
    const lhs = opp*opp + adj*adj;
    const rhs = hyp*hyp;
    const tol = Math.max(1e-9, rhs * 1e-6);
    if (Math.abs(lhs - rhs) > tol){
      return { ok:false, msg:"No cumple Pitágoras: opuesto² + adyacente² ≠ hipotenusa²." };
    }
    return { ok:true, msg:"Triángulo válido (Pitágoras OK)." };
  }

  // UI injection: inputs de lados + canvas + formulas
  function injectUI(){
    // Asumimos que tu HTML original tiene:
    // - inputs #a y #b (ángulos) + botones #calc/#swap/#clear
    // - contenedores #outA y #outB
    // - #status
    // Vamos a mantenerlos, pero NO los usaremos para calcular.
    const leftCard = document.querySelector(".grid .card"); // primera card de tu HTML original
    if (!leftCard) return;

    // Evitar duplicar
    if ($("triSidesBox")) return;

    const box = document.createElement("div");
    box.id = "triSidesBox";
    box.innerHTML = `
      <div style="margin-top:12px; padding-top:12px; border-top:1px solid rgba(36,48,90,.6);">
        <div style="font-weight:800; margin-bottom:8px;">Cálculo por lados (NO por ángulos)</div>

        <div class="row">
          <div>
            <label for="sideOpp">Cateto opuesto</label>
            <input id="sideOpp" type="number" step="any" min="0" placeholder="Ej: 3" />
          </div>
          <div>
            <label for="sideAdj">Cateto adyacente</label>
            <input id="sideAdj" type="number" step="any" min="0" placeholder="Ej: 4" />
          </div>
          <div>
            <label for="sideHyp">Hipotenusa</label>
            <input id="sideHyp" type="number" step="any" min="0" placeholder="Ej: 5" />
          </div>
        </div>

        <div class="btns" style="margin-top:10px;">
          <button id="calcSides">Calcular con lados</button>
          <button id="clearSides" class="secondary">Limpiar lados</button>
        </div>

        <div class="status" id="sideStatus"></div>
      </div>
    `;
    leftCard.appendChild(box);

    // Insertar canvas arriba de resultados (segunda card)
    const rightCard = document.querySelector(".grid .card:nth-child(2)");
    if (rightCard && !$("triCanvasWrap")){
      const wrap = document.createElement("div");
      wrap.id = "triCanvasWrap";
      wrap.innerHTML = `
        <div style="margin-bottom:12px; border:1px solid rgba(36,48,90,.8); border-radius:16px; overflow:hidden; background:#0f1730;">
          <canvas id="triCanvas" width="900" height="520" style="width:100%; height:280px; display:block;"></canvas>
        </div>
        <div class="status" id="triLegend"></div>

        <div style="margin-top:12px; border-top:1px solid rgba(36,48,90,.6); padding-top:12px;">
          <div style="font-weight:800; margin-bottom:8px;">¿Cómo se calculan?</div>
          <div id="formulaBox"></div>
        </div>
      `;
      rightCard.insertBefore(wrap, rightCard.firstChild);
    }
  }

  // Dibujo del triángulo a,b,c
  function drawTriangle(opp, adj, hyp){
    const canvas = $("triCanvas");
    const legend = $("triLegend");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0,0,W,H);

    // Fondo
    ctx.fillStyle = "rgba(255,255,255,0.02)";
    ctx.fillRect(0,0,W,H);

    // Si no hay lados, dibujar algo default
    let a = adj, b = opp, c = hyp;
    if (!(a>0 && b>0 && c>0)){
      a = 4; b = 3; c = 5;
    }

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

    // Cuadrito ángulo recto
    const s = 26;
    ctx.strokeStyle = "rgba(238,242,255,0.75)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x1 + s, y1);
    ctx.lineTo(x1 + s, y1 - s);
    ctx.lineTo(x1, y1 - s);
    ctx.stroke();

    // Textos
    ctx.fillStyle = "rgba(238,242,255,0.92)";
    ctx.font = "18px system-ui, -apple-system, Segoe UI, Roboto, Arial";

    ctx.fillText(`cateto adyacente = ${formatDecimal(a)}`, (x1 + x2)/2 - 110, y1 + 32);
    ctx.fillText(`cateto opuesto = ${formatDecimal(b)}`, x1 - 150, (y1 + y3)/2);
    ctx.fillText(`hipotenusa = ${formatDecimal(c)}`, (x2 + x3)/2 + 12, (y2 + y3)/2 - 12);

    if (legend){
      legend.innerHTML = `<span class="ok">Dibujo por lados</span> — opuesto=${formatDecimal(b)}, adyacente=${formatDecimal(a)}, hipotenusa=${formatDecimal(c)}.`;
    }
  }

  // Construye HTML de fórmula con fracción + decimal
  function buildRow(name, fracObj, dec){
    if (fracObj.kind === "undef"){
      return `
        <tr>
          <td class="op">${name}</td>
          <td><span class="undef">No definida</span></td>
        </tr>
      `;
    }
    const pill = fracObj.kind === "frac"
      ? `<span class="exact">Fracción</span>`
      : `<span class="approx">Aprox.</span>`;

    return `
      <tr>
        <td class="op">${name}</td>
        <td>
          <div class="val">
            ${pill}
            <div>${fracObj.html}</div>
            <div class="muted mono">≈ ${formatDecimal(dec)}</div>
          </div>
        </td>
      </tr>
    `;
  }

  function renderFormulaBox(){
    const box = $("formulaBox");
    if (!box) return;

    box.innerHTML = `
      <div class="small" style="margin-bottom:10px;">
        Usamos la lógica del triángulo rectángulo:
        <span class="mono">seno = opuesto/hipotenusa</span>,
        <span class="mono">coseno = adyacente/hipotenusa</span>, etc.
      </div>

      <table>
        <thead>
          <tr>
            <th>Razón</th>
            <th>Fórmula</th>
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

    const chk = isValidTriangle(opp, adj, hyp);
    if (sideStatus){
      sideStatus.innerHTML = chk.ok
        ? `<span class="ok">✔ ${chk.msg}</span>`
        : `<span class="warn">⚠ ${chk.msg}</span> <span class="muted">(Igual se calculará con las fracciones ingresadas.)</span>`;
    }

    // Razones (solo por lados)
    const sinV = hyp === 0 ? Infinity : opp / hyp;
    const cosV = hyp === 0 ? Infinity : adj / hyp;
    const tanV = adj === 0 ? Infinity : opp / adj;
    const cotV = opp === 0 ? Infinity : adj / opp;
    const secV = adj === 0 ? Infinity : hyp / adj;
    const cscV = opp === 0 ? Infinity : hyp / opp;

    // Fracciones
    const sinF = simplifyFraction(opp, hyp);
    const cosF = simplifyFraction(adj, hyp);
    const tanF = simplifyFraction(opp, adj);
    const cotF = simplifyFraction(adj, opp);
    const secF = simplifyFraction(hyp, adj);
    const cscF = simplifyFraction(hyp, opp);

    // Tabla de resultados (usamos outA, outB como paneles ya existentes)
    const tableHTML = `
      <div class="mono" style="margin-bottom:10px">
        Resultados por lados (no depende de ángulos)
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
    renderFormulaBox();
  }

  function clearSides(){
    $("sideOpp").value = "";
    $("sideAdj").value = "";
    $("sideHyp").value = "";
    $("sideStatus").innerHTML = "";
    $("outA").innerHTML = "";
    $("outB").innerHTML = "";
    drawTriangle(null, null, null);
    renderFormulaBox();
  }

  function disableAngleLogic(){
    // Deshabilitar impacto de ángulos: dejamos inputs pero no calculan nada
    const status = $("status");
    if (status){
      status.innerHTML = `<span class="warn">Los ángulos NO se usan. Este módulo calcula solo por lados.</span>`;
    }

    // Botones originales: los dejamos pero hacemos que llamen a calculateBySides
    $("calc")?.addEventListener("click", (e) => {
      e.preventDefault();
      calculateBySides();
    });

    $("swap")?.addEventListener("click", (e) => {
      e.preventDefault();
      // swap solo visual (si quieres), pero no afecta.
      const a = $("a"), b = $("b");
      if (a && b){
        const tmp = a.value; a.value = b.value; b.value = tmp;
      }
      calculateBySides();
    });

    $("clear")?.addEventListener("click", (e) => {
      e.preventDefault();
      // limpia ángulos si quieres
      if ($("a")) $("a").value = "";
      if ($("b")) $("b").value = "";
      clearSides();
    });

    // Enter en ángulos también recalcula por lados
    [$("a"), $("b")].forEach(inp => {
      inp?.addEventListener("keydown", (e) => { if (e.key === "Enter") calculateBySides(); });
    });
  }

  function init(){
    injectUI();
    disableAngleLogic();

    $("calcSides")?.addEventListener("click", calculateBySides);
    $("clearSides")?.addEventListener("click", clearSides);

    // Recalcular al cambiar lados
    ["sideOpp","sideAdj","sideHyp"].forEach(id => {
      $(id)?.addEventListener("change", calculateBySides);
      $(id)?.addEventListener("keydown", (e) => { if (e.key === "Enter") calculateBySides(); });
    });

    // Inicial: dibuja y muestra fórmulas
    drawTriangle(null, null, null);
    renderFormulaBox();
  }

  document.addEventListener("DOMContentLoaded", init);
})();
