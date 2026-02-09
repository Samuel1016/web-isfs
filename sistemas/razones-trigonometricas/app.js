(() => {
  // ---------- Helpers de renderizado (fracciones/raíces) ----------
  function fracHTML(numHTML, denHTML){
    return `<span class="frac"><sup>${numHTML}</sup><span class="bar"></span><sub>${denHTML}</sub></span>`;
  }
  function sqrtHTML(radicandHTML){
    return `<span class="sqrt"><span class="sign">&radic;</span><span class="radicand">${radicandHTML}</span></span>`;
  }

  // ---------- Matemática ----------
  const DEG2RAD = Math.PI / 180;

  function cleanNumber(x){
    if (!isFinite(x)) return x;
    if (Math.abs(x) < 5e-16) return 0; // evitar -0
    return x;
  }

  function toFraction(x, maxDen=1000){
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

  function formatDecimal(x){
    if (!isFinite(x)) return "No definida";
    x = cleanNumber(x);
    let s = x.toFixed(10);
    s = s.replace(/\.?0+$/,'');
    return s;
  }

  // ---------- Valores exactos (0,15,30,45,60,75,90) ----------
  function exactTrig(deg, fn){
    const a = Math.round(deg*1000000)/1000000;
    const key = String(a);

    const SQ2 = sqrtHTML("2");
    const SQ3 = sqrtHTML("3");
    const SQ6 = sqrtHTML("6");

    const M = {
      "0": {
        sin: "0",
        cos: "1",
        tan: "0",
        csc: "No definida",
        sec: "1",
        cot: "No definida",
      },
      "15": {
        sin: fracHTML(`${SQ6} &minus; ${SQ2}`, "4"),
        cos: fracHTML(`${SQ6} &plus; ${SQ2}`, "4"),
        tan: `2 &minus; ${SQ3}`,
        csc: fracHTML("4", `${SQ6} &minus; ${SQ2}`),
        sec: fracHTML("4", `${SQ6} &plus; ${SQ2}`),
        cot: `2 &plus; ${SQ3}`,
      },
      "30": {
        sin: fracHTML("1", "2"),
        cos: fracHTML(SQ3, "2"),
        tan: fracHTML("1", SQ3),
        csc: "2",
        sec: fracHTML("2", SQ3),
        cot: SQ3,
      },
      "45": {
        sin: fracHTML(SQ2, "2"),
        cos: fracHTML(SQ2, "2"),
        tan: "1",
        csc: SQ2,
        sec: SQ2,
        cot: "1",
      },
      "60": {
        sin: fracHTML(SQ3, "2"),
        cos: fracHTML("1", "2"),
        tan: SQ3,
        csc: fracHTML("2", SQ3),
        sec: "2",
        cot: fracHTML("1", SQ3),
      },
      "75": {
        sin: fracHTML(`${SQ6} &plus; ${SQ2}`, "4"),
        cos: fracHTML(`${SQ6} &minus; ${SQ2}`, "4"),
        tan: `2 &plus; ${SQ3}`,
        csc: fracHTML("4", `${SQ6} &plus; ${SQ2}`),
        sec: fracHTML("4", `${SQ6} &minus; ${SQ2}`),
        cot: `2 &minus; ${SQ3}`,
      },
      "90": {
        sin: "1",
        cos: "0",
        tan: "No definida",
        csc: "1",
        sec: "No definida",
        cot: "0",
      },
    };

    if (!M[key] || !M[key][fn]) return null;
    const v = M[key][fn];
    const undef = (v === "No definida");
    return { exactHTML: v, isUndef: undef };
  }

  function computeRatios(deg){
    const rad = deg * DEG2RAD;
    const s = Math.sin(rad), c = Math.cos(rad);

    const tan = (Math.abs(c) < 1e-15) ? Infinity : s/c;
    const cot = (Math.abs(s) < 1e-15) ? Infinity : c/s;
    const sec = (Math.abs(c) < 1e-15) ? Infinity : 1/c;
    const csc = (Math.abs(s) < 1e-15) ? Infinity : 1/s;

    return { sin: s, cos: c, tan, cot, sec, csc };
  }

  function renderValue(deg, fn, numeric){
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

  function makeTable(deg){
    const r = computeRatios(deg);
    const rows = [
      ["sen", "sin", r.sin],
      ["cos", "cos", r.cos],
      ["tan", "tan", r.tan],
      ["cot", "cot", r.cot],
      ["sec", "sec", r.sec],
      ["csc", "csc", r.csc],
    ];

    let html = `
      <div class="mono" style="margin-bottom:10px">
        &ang; = <b>${deg}</b>°
      </div>

      <div class="tableWrap">
        <table>
          <thead>
            <tr>
              <th>Razón</th>
              <th>Valor (exacto / fracción aprox.) y decimal</th>
            </tr>
          </thead>
          <tbody>
    `;

    for (const [label, fn, val] of rows){
      html += `
        <tr>
          <td class="op">${label}(${deg}°)</td>
          <td>${renderValue(deg, fn, val)}</td>
        </tr>
      `;
    }

    html += `
          </tbody>
        </table>
      </div>
    `;
    return html;
  }

  // ---------- Lógica de UI ----------
  const elA = document.getElementById("a");
  const elB = document.getElementById("b");
  const outA = document.getElementById("outA");
  const outB = document.getElementById("outB");
  const status = document.getElementById("status");

  function showStatus(msg, kind=""){
    if (!status) return;
    const cls = kind ? `<span class="${kind}">${msg}</span>` : msg;
    status.innerHTML = cls;
  }

  function parseAngle(v){
    if (v === "" || v === null || v === undefined) return null;
    const n = Number(v);
    if (!isFinite(n)) return null;
    return n;
  }

  function within(x, lo, hi){ return x >= lo - 1e-9 && x <= hi + 1e-9; }

  function calculate(){
    let A = parseAngle(elA?.value);
    let B = parseAngle(elB?.value);

    if (A === null){
      showStatus("Escribe un valor válido para el ángulo A.", "bad");
      return;
    }

    if (elB && elB.value.trim() === ""){
      B = 90 - A;
      elB.value = (Math.round(B*1000000)/1000000).toString();
      showStatus("B se calculó automáticamente como 90° − A.", "ok");
    } else {
      if (B === null){
        showStatus("Si escribes B, debe ser un número válido.", "bad");
        return;
      }
      const sum = A + B;
      if (Math.abs(sum - 90) > 1e-6){
        showStatus(`Ojo: A + B = ${formatDecimal(sum)}°. Debe ser 90° en un triángulo rectángulo.`, "warn");
      } else {
        showStatus("Correcto: A + B = 90° (triángulo rectángulo).", "ok");
      }
    }

    if (!within(A, 0, 90) || !within(B, 0, 90)){
      showStatus("A y B deberían estar entre 0° y 90° (incluidos).", "warn");
    }

    outA.innerHTML = makeTable(A);
    outB.innerHTML = makeTable(B);
  }

  function init(){
    document.getElementById("calc")?.addEventListener("click", calculate);
    document.getElementById("swap")?.addEventListener("click", () => {
      const tmp = elA.value; elA.value = elB.value; elB.value = tmp;
      calculate();
    });
    document.getElementById("clear")?.addEventListener("click", () => {
      elA.value = ""; elB.value = "";
      outA.innerHTML = ""; outB.innerHTML = "";
      showStatus("Listo. Escribe los ángulos y pulsa Calcular.");
    });

    [elA, elB].forEach(node => node?.addEventListener("keydown", (e) => {
      if (e.key === "Enter") calculate();
    }));

    calculate();
  }

  document.addEventListener("DOMContentLoaded", init);
})();
