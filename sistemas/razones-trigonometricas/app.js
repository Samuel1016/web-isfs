(() => {
  /*******************************
   * 0) Utilidades
   *******************************/
  const DEG2RAD = Math.PI / 180;
  const RAD2DEG = 180 / Math.PI;

  const $ = (sel, root=document) => root.querySelector(sel);

  function esc(str){
    return String(str ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

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

  function within(x, lo, hi){ return x >= lo - 1e-9 && x <= hi + 1e-9; }

  function gcd(a,b){
    a = Math.abs(a); b = Math.abs(b);
    while (b) { const t = b; b = a % b; a = t; }
    return a || 1;
  }

  function toFraction(x, maxDen=2000){
    if (!isFinite(x)) return null;
    x = cleanNumber(x);
    const sign = x < 0 ? -1 : 1;
    x = Math.abs(x);

    if (Math.abs(x - Math.round(x)) < 1e-12) return { n: sign * Math.round(x), d: 1 };

    let h1=1, h0=0, k1=0, k0=1;
    let b = x;

    for (let i=0; i<30; i++){
      const a = Math.floor(b);
      const h2 = a*h1 + h0;
      const k2 = a*k1 + k0;
      if (k2 > maxDen) break;

      h0=h1; h1=h2;
      k0=k1; k1=k2;

      const frac = b - a;
      if (frac < 1e-15) break;
      b = 1/frac;
    }
    return { n: sign*h1, d: k1 };
  }

  /*******************************
   * 1) Render fracciones/raíces
   *******************************/
  function fracHTML(numHTML, denHTML){
    return `<span class="frac"><sup>${numHTML}</sup><span class="bar"></span><sub>${denHTML}</sub></span>`;
  }
  function sqrtHTML(radicandHTML){
    return `<span class="sqrt"><span class="sign">&radic;</span><span class="radicand">${radicandHTML}</span></span>`;
  }

  /*******************************
   * 2) Exactos por ángulo (0,15,30,45,60,75,90)
   *******************************/
  function exactTrig(deg, fn){
    const a = Math.round(deg*1000000)/1000000;
    const key = String(a);

    const SQ2 = sqrtHTML("2");
    const SQ3 = sqrtHTML("3");
    const SQ6 = sqrtHTML("6");

    const M = {
      "0":   { sin:"0", cos:"1", tan:"0", csc:"No definida", sec:"1", cot:"No definida" },
      "15":  {
        sin: fracHTML(`${SQ6} &minus; ${SQ2}`, "4"),
        cos: fracHTML(`${SQ6} &plus; ${SQ2}`, "4"),
        tan: `2 &minus; ${SQ3}`,
        csc: fracHTML("4", `${SQ6} &minus; ${SQ2}`),
        sec: fracHTML("4", `${SQ6} &plus; ${SQ2}`),
        cot: `2 &plus; ${SQ3}`,
      },
      "30":  { sin:fracHTML("1","2"), cos:fracHTML(SQ3,"2"), tan:fracHTML("1",SQ3), csc:"2", sec:fracHTML("2",SQ3), cot:SQ3 },
      "45":  { sin:fracHTML(SQ2,"2"), cos:fracHTML(SQ2,"2"), tan:"1", csc:SQ2, sec:SQ2, cot:"1" },
      "60":  { sin:fracHTML(SQ3,"2"), cos:fracHTML("1","2"), tan:SQ3, csc:fracHTML("2",SQ3), sec:"2", cot:fracHTML("1",SQ3) },
      "75":  {
        sin: fracHTML(`${SQ6} &plus; ${SQ2}`, "4"),
        cos: fracHTML(`${SQ6} &minus; ${SQ2}`, "4"),
        tan: `2 &plus; ${SQ3}`,
        csc: fracHTML("4", `${SQ6} &plus; ${SQ2}`),
        sec: fracHTML("4", `${SQ6} &minus; ${SQ2}`),
        cot: `2 &minus; ${SQ3}`,
      },
      "90":  { sin:"1", cos:"0", tan:"No definida", csc:"1", sec:"No definida", cot:"0" },
    };

    if (!M[key] || !M[key][fn]) return null;
    const v = M[key][fn];
    const undef = (v === "No definida");
    return { exactHTML: v, isUndef: undef };
  }

  /*******************************
   * 3) UI: inyectar inputs de lados + canvas
   *******************************/
  function injectSidesUI(){
    const leftCard = $(".rtGrid .rtCard");
    if (!leftCard) return;
    if ($("#triSidesBox", leftCard)) return;

    const box = document.createElement("div");
    box.id = "triSidesBox";
    box.innerHTML = `
      <div style="margin-top:12px; padding-top:12px; border-top:1px solid rgba(15,23,42,0.10);">
        <div style="font-weight:900; color: rgba(11,18,32,0.78); margin-bottom:6px;">
          Triángulo (opcional): catetos e hipotenusa
        </div>
        <div style="font-size:12.5px; color: rgba(11,18,32,0.66); line-height:1.35; margin-bottom:10px;">
          Si completas los lados, las razones se calculan como fracciones (ej: <span class="mono">3/5</span>) y también en decimal.
          Para el ángulo <b>A</b>: <b>opuesto</b> / <b>hipotenusa</b>.
        </div>

        <div class="rtRow" style="margin-top:6px;">
          <div>
            <label for="sideOppA">Cateto opuesto a A</label>
            <input id="sideOppA" type="number" step="any" min="0" placeholder="Ej: 3" />
          </div>

          <div>
            <label for="sideAdjA">Cateto adyacente a A</label>
            <input id="sideAdjA" type="number" step="any" min="0" placeholder="Ej: 4" />
          </div>

          <div>
            <label for="sideHyp">Hipotenusa</label>
            <input id="sideHyp" type="number" step="any" min="0" placeholder="Ej: 5" />
          </div>
        </div>

        <div style="display:flex; gap:10px; flex-wrap:wrap; margin-top:12px;">
          <button id="useSides" type="button" class="secondary">Usar lados (calcular A y B)</button>
          <button id="clearSides" type="button" class="secondary">Limpiar lados</button>
        </div>

        <div class="rtSmall" id="sideHint" style="margin-top:10px;"></div>
      </div>
    `;

    leftCard.appendChild(box);
  }

  function injectCanvasUI(){
    const rightCard = $(".rtGrid .rtCard:nth-child(2)");
    if (!rightCard) return;
    if ($("#triCanvasWrap", rightCard)) return;

    const wrap = document.createElement("div");
    wrap.id = "triCanvasWrap";
    wrap.style.marginBottom = "12px";
    wrap.innerHTML = `
      <div style="
        border:1px solid rgba(15,23,42,0.10);
        border-radius: 18px;
        background: rgba(15,23,42,0.03);
        overflow:hidden;
      ">
        <canvas id="triCanvas" width="900" height="520" style="width:100%; height: 280px; display:block;"></canvas>
      </div>
      <div class="rtSmall" id="triLegend" style="margin-top:8px;"></div>
    `;

    const split = $(".rtSplit", rightCard);
    rightCard.insertBefore(wrap, split);
  }

  /*******************************
   * 4) Cálculos: por ángulos o por lados
   *******************************/
  function computeRatiosFromAngles(deg){
    const rad = deg * DEG2RAD;
    const s = Math.sin(rad), c = Math.cos(rad);

    const tan = (Math.abs(c) < 1e-15) ? Infinity : s/c;
    const cot = (Math.abs(s) < 1e-15) ? Infinity : c/s;
    const sec = (Math.abs(c) < 1e-15) ? Infinity : 1/c;
    const csc = (Math.abs(s) < 1e-15) ? Infinity : 1/s;

    return { sin: s, cos: c, tan, cot, sec, csc };
  }

  function ratiosFromSidesForA(opp, adj, hyp){
    const sin = hyp === 0 ? Infinity : opp / hyp;
    const cos = hyp === 0 ? Infinity : adj / hyp;
    const tan = adj === 0 ? Infinity : opp / adj;

    const csc = (opp === 0) ? Infinity : hyp / opp;
    const sec = (adj === 0) ? Infinity : hyp / adj;
    const cot = (opp === 0) ? Infinity : adj / opp;

    return { sin, cos, tan, cot, sec, csc };
  }

  function isValidTriangle(opp, adj, hyp){
    if (opp == null || adj == null || hyp == null) return { ok:false, msg:"" };
    if (!(opp > 0 && adj > 0 && hyp > 0)) return { ok:false, msg:"Los lados deben ser positivos." };

    const lhs = opp*opp + adj*adj;
    const rhs = hyp*hyp;
    const tol = Math.max(1e-9, rhs * 1e-6);

    if (Math.abs(lhs - rhs) > tol){
      return { ok:false, msg:"No cumple Pitágoras: cateto² + cateto² ≠ hipotenusa²." };
    }
    return { ok:true, msg:"Triángulo válido (Pitágoras OK)." };
  }

  function simplifyRatio(num, den){
    if (!isFinite(num) || !isFinite(den)) return null;
    if (den === 0) return { html: "No definida", kind: "undef" };

    const nR = Math.round(num);
    const dR = Math.round(den);
    const isIntish = Math.abs(num - nR) < 1e-10 && Math.abs(den - dR) < 1e-10;

    if (isIntish){
      const g = gcd(nR, dR);
      const n = nR / g;
      const d = dR / g;
      return { html: fracHTML(String(n), String(d)), kind: "frac" };
    }

    const fr = toFraction(num/den, 2000);
    if (!fr) return null;
    return { html: fracHTML(String(fr.n), String(fr.d)), kind: "approx" };
  }

  /*******************************
   * 5) Render de tablas
   *******************************/
  function renderValueAngleOrSides(deg, fn, numeric, sidesMode, ratioNumDen){
    if (sidesMode && ratioNumDen){
      const [num, den] = ratioNumDen;
      const frac = simplifyRatio(num, den);

      if (!frac || frac.html === "No definida"){
        return `<div class="val"><span class="undef">No definida</span><div class="muted mono">∞</div></div>`;
      }

      const pill = frac.kind === "frac"
        ? `<span class="exact">Fracción</span>`
        : `<span class="approx">Aprox.</span>`;

      return `
        <div class="val">
          ${pill}
          <div>${frac.html}</div>
          <div class="muted mono">≈ ${formatDecimal(numeric)}</div>
        </div>
      `;
    }

    const ex = exactTrig(deg, fn);
    if (ex){
      const dec = ex.isUndef ? "No definida" : formatDecimal(numeric);
      const pill = ex.isUndef ? `<span class="undef">No definida</span>` : `<span class="exact">Exacta</span>`;
      return `
        <div class="val">
          ${pill}
          <div>${ex.exactHTML}</div>
          <div class="muted mono">= ${dec}</div>
        </div>
      `;
    }

    if (!isFinite(numeric)){
      return `<div class="val"><span class="undef">No definida</span><div class="muted mono">∞</div></div>`;
    }

    const fr = toFraction(numeric, 2000);
    const fracStr = fr ? fracHTML(String(fr.n), String(fr.d)) : "—";
    return `
      <div class="val">
        <span class="approx">Aprox.</span>
        <div>${fracStr}</div>
        <div class="muted mono">≈ ${formatDecimal(numeric)}</div>
      </div>
    `;
  }

  function makeTable(deg, ratios, sidesMode=false, sideTriplet=null, angleLabel="A"){
    const rows = [
      ["sen", "sin", ratios.sin],
      ["cos", "cos", ratios.cos],
      ["tan", "tan", ratios.tan],
      ["cot", "cot", ratios.cot],
      ["sec", "sec", ratios.sec],
      ["csc", "csc", ratios.csc],
    ];

    const nd = {};
    if (sidesMode && sideTriplet){
      const { opp, adj, hyp } = sideTriplet;
      nd.sin = [opp, hyp];
      nd.cos = [adj, hyp];
      nd.tan = [opp, adj];
      nd.cot = [adj, opp];
      nd.sec = [hyp, adj];
      nd.csc = [hyp, opp];
    }

    let html = `
      <div class="mono" style="margin-bottom:10px">
        &ang; <b>${angleLabel}</b> = <b>${formatDecimal(deg)}</b>°
        ${sidesMode ? `<span class="muted"> (por lados)</span>` : ``}
      </div>

      <div class="tableWrap">
        <table>
          <thead>
            <tr>
              <th>Razón</th>
              <th>Valor (exacto / fracción) y decimal</th>
            </tr>
          </thead>
          <tbody>
    `;

    for (const [label, fn, val] of rows){
      html += `
        <tr>
          <td class="op">${label}(${formatDecimal(deg)}°)</td>
          <td>${renderValueAngleOrSides(deg, fn, val, sidesMode, nd[fn] || null)}</td>
        </tr>
      `;
    }

    html += `</tbody></table></div>`;
    return html;
  }

  /*******************************
   * 6) Dibujo del triángulo (ahora a, b, c)
   * Definimos:
   *   - Cateto a = adyacente a A (base)
   *   - Cateto b = opuesto a A (altura)
   *   - Hipotenusa c
   *******************************/
  function drawTriangle(canvas, legendEl, Adeg, Bdeg, bCateto, aCateto, cHyp){
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0,0,W,H);

    // Fondo suave
    ctx.fillStyle = "rgba(15,23,42,0.03)";
    ctx.fillRect(0,0,W,H);

    // Si no hay lados, dibujamos un triángulo proporcional
    let a = aCateto;
    let b = bCateto;
    let c = cHyp;

    if (!(a>0 && b>0)){
      const rad = (Adeg ?? 45) * DEG2RAD;
      a = 4;
      b = Math.tan(rad) * a;
      if (!(b>0)) b = 4;
      c = Math.sqrt(a*a + b*b);
    } else if (!(c>0)) {
      c = Math.sqrt(a*a + b*b);
    }

    const pad = 70;
    const maxX = W - pad*2;
    const maxY = H - pad*2;
    const scale = Math.min(maxX / a, maxY / b);

    const ox = pad + 40;
    const oy = H - pad;

    const x1 = ox, y1 = oy;               // ángulo recto
    const x2 = ox + a*scale, y2 = oy;     // base (cateto a)
    const x3 = ox, y3 = oy - b*scale;     // altura (cateto b)

    // Ejes
    ctx.strokeStyle = "rgba(15,23,42,0.10)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(ox, oy); ctx.lineTo(ox + maxX, oy);
    ctx.moveTo(ox, oy); ctx.lineTo(ox, oy - maxY);
    ctx.stroke();

    // Triángulo
    ctx.strokeStyle = "rgba(47,108,246,0.85)";
    ctx.lineWidth = 4;
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(x1,y1);
    ctx.lineTo(x2,y2);
    ctx.lineTo(x3,y3);
    ctx.closePath();
    ctx.stroke();

    // Cuadrado ángulo recto
    const s = 26;
    ctx.strokeStyle = "rgba(11,18,32,0.45)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x1 + s, y1);
    ctx.lineTo(x1 + s, y1 - s);
    ctx.lineTo(x1, y1 - s);
    ctx.stroke();

    // Textos
    ctx.fillStyle = "rgba(11,18,32,0.85)";
    ctx.font = "18px system-ui, -apple-system, Segoe UI, Roboto, Arial";

    ctx.fillText(`cateto a = ${formatDecimal(a)}`, (x1 + x2)/2 - 70, y1 + 32);
    ctx.fillText(`cateto b = ${formatDecimal(b)}`, x1 - 120, (y1 + y3)/2);
    ctx.fillText(`hipotenusa c = ${formatDecimal(c)}`, (x2 + x3)/2 + 10, (y2 + y3)/2 - 10);

    if (legendEl){
      const modeTxt = (aCateto && bCateto && cHyp) ? "por lados" : "por ángulos (dibujo aprox.)";
      legendEl.textContent = `A=${formatDecimal(Adeg)}°, B=${formatDecimal(Bdeg)}° — ${modeTxt}.`;
    }
  }

  /*******************************
   * 7) Lógica principal
   *******************************/
  let elA, elB, outA, outB, statusEl;
  let sideOppAEl, sideAdjAEl, sideHypEl, sideHintEl;
  let triCanvas, triLegend;

  function showStatus(msg, kind=""){
    if (!statusEl) return;
    statusEl.innerHTML = kind ? `<span class="${kind}">${esc(msg)}</span>` : esc(msg);
  }

  function getSides(){
    const opp = parseNum(sideOppAEl?.value); // esto será cateto b (opuesto a A)
    const adj = parseNum(sideAdjAEl?.value); // esto será cateto a (adyacente a A)
    const hyp = parseNum(sideHypEl?.value);  // hipotenusa c
    return { opp, adj, hyp };
  }

  function calculateFromCurrentInputs(){
    let A = parseNum(elA?.value);
    let B = parseNum(elB?.value);

    if (A == null){
      showStatus("Escribe un valor válido para el ángulo A.", "bad");
      return;
    }

    // Si B vacío => B = 90 - A
    if (elB && elB.value.trim() === ""){
      B = 90 - A;
      elB.value = (Math.round(B*1000000)/1000000).toString();
      showStatus("B se calculó automáticamente como 90° − A.", "ok");
    } else {
      if (B == null){
        showStatus("Si escribes B, debe ser un número válido.", "bad");
        return;
      }
      const sum = A + B;
      if (Math.abs(sum - 90) > 1e-6){
        showStatus(`Ojo: A + B = ${formatDecimal(sum)}°. Debe ser 90° en un triángulo rectángulo.`, "warn");
      } else {
        showStatus("Correcto: A + B = 90°.", "ok");
      }
    }

    if (!within(A, 0, 90) || !within(B, 0, 90)){
      showStatus("A y B deberían estar entre 0° y 90° (incluidos).", "warn");
    }

    const { opp, adj, hyp } = getSides();
    const sidesFilled = (opp != null || adj != null || hyp != null);

    let useSides = false;
    let ratiosA, ratiosB;
    let AA = A, BB = B;

    if (sidesFilled && opp != null && adj != null && hyp != null){
      const chk = isValidTriangle(opp, adj, hyp);
      if (sideHintEl) sideHintEl.innerHTML = chk.ok
        ? `<span class="ok" style="font-weight:900;">✔ ${esc(chk.msg)}</span>`
        : `<span class="bad" style="font-weight:900;">✖ ${esc(chk.msg)}</span>`;

      if (chk.ok){
        useSides = true;

        // ángulos desde lados: A = atan(opuesto/adyacente)
        AA = Math.atan2(opp, adj) * RAD2DEG;
        BB = 90 - AA;

        if (elA) elA.value = (Math.round(AA*1000000)/1000000).toString();
        if (elB) elB.value = (Math.round(BB*1000000)/1000000).toString();

        ratiosA = ratiosFromSidesForA(opp, adj, hyp);
        // para B, se invierten catetos
        ratiosB = ratiosFromSidesForA(adj, opp, hyp);

        showStatus("Calculando por lados (fracciones + decimal).", "ok");
      } else {
        useSides = false;
        ratiosA = computeRatiosFromAngles(A);
        ratiosB = computeRatiosFromAngles(B);
      }
    } else {
      if (sideHintEl) sideHintEl.textContent = "";
      ratiosA = computeRatiosFromAngles(A);
      ratiosB = computeRatiosFromAngles(B);
    }

    outA.innerHTML = makeTable(
      AA,
      ratiosA,
      useSides,
      useSides ? { opp, adj, hyp } : null,
      "A"
    );

    outB.innerHTML = makeTable(
      BB,
      ratiosB,
      useSides,
      useSides ? { opp: adj, adj: opp, hyp } : null,
      "B"
    );

    // Canvas con a,b,c:
    // cateto a = adj(A), cateto b = opp(A), hipotenusa c = hyp
    drawTriangle(triCanvas, triLegend, AA, BB, useSides ? opp : null, useSides ? adj : null, useSides ? hyp : null);
  }

  function init(){
    injectSidesUI();
    injectCanvasUI();

    elA = document.getElementById("a");
    elB = document.getElementById("b");
    outA = document.getElementById("outA");
    outB = document.getElementById("outB");
    statusEl = document.getElementById("status");

    sideOppAEl = document.getElementById("sideOppA");
    sideAdjAEl = document.getElementById("sideAdjA");
    sideHypEl  = document.getElementById("sideHyp");
    sideHintEl = document.getElementById("sideHint");

    triCanvas = document.getElementById("triCanvas");
    triLegend = document.getElementById("triLegend");

    document.getElementById("calc")?.addEventListener("click", calculateFromCurrentInputs);

    document.getElementById("swap")?.addEventListener("click", () => {
      const tmp = elA.value; elA.value = elB.value; elB.value = tmp;
      calculateFromCurrentInputs();
    });

    document.getElementById("clear")?.addEventListener("click", () => {
      elA.value = "";
      elB.value = "";
      outA.innerHTML = "";
      outB.innerHTML = "";
      showStatus("Listo. Escribe los ángulos y pulsa Calcular.");
      drawTriangle(triCanvas, triLegend, 45, 45, null, null, null);
    });

    document.getElementById("useSides")?.addEventListener("click", () => {
      calculateFromCurrentInputs();
    });

    document.getElementById("clearSides")?.addEventListener("click", () => {
      if (sideOppAEl) sideOppAEl.value = "";
      if (sideAdjAEl) sideAdjAEl.value = "";
      if (sideHypEl) sideHypEl.value = "";
      if (sideHintEl) sideHintEl.textContent = "";
      showStatus("Lados limpiados. Calculando por ángulos.", "ok");
      calculateFromCurrentInputs();
    });

    [elA, elB, sideOppAEl, sideAdjAEl, sideHypEl].forEach(node => {
      node?.addEventListener("keydown", (e) => { if (e.key === "Enter") calculateFromCurrentInputs(); });
    });

    [sideOppAEl, sideAdjAEl, sideHypEl].forEach(node => {
      node?.addEventListener("change", () => calculateFromCurrentInputs());
    });

    calculateFromCurrentInputs();
  }

  document.addEventListener("DOMContentLoaded", init);
})();
