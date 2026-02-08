/***********************
 * 1) PRONUNCIACIÓN (texto debajo de la letra)
 ***********************/
const letterPron = {
  A: "ei",
  B: "bi",
  C: "si",
  D: "di",
  E: "i",
  F: "ef",
  G: "yi",
  H: "eich",
  I: "ai",
  J: "yei",
  K: "kei",
  L: "el",
  M: "em",
  N: "en",
  O: "ou",
  P: "pi",
  Q: "kiu",
  R: "ar",
  S: "es",
  T: "ti",
  U: "iu",
  V: "vi",
  W: "dábol-iu",
  X: "eks",
  Y: "wai",
  Z: "zi"
};

/***********************
 * 2) IPA (referencia)
 ***********************/
const letterIPA = {
  A: "/eɪ/",
  B: "/biː/",
  C: "/siː/",
  D: "/diː/",
  E: "/iː/",
  F: "/ɛf/",
  G: "/dʒiː/",
  H: "/eɪtʃ/",
  I: "/aɪ/",
  J: "/dʒeɪ/",
  K: "/keɪ/",
  L: "/ɛl/",
  M: "/ɛm/",
  N: "/ɛn/",
  O: "/oʊ/",
  P: "/piː/",
  Q: "/kjuː/",
  R: "/ɑr/ (US), /ɑː/ (UK)",
  S: "/ɛs/",
  T: "/tiː/",
  U: "/juː/",
  V: "/viː/",
  W: "/ˈdʌbəl.juː/",
  X: "/ɛks/",
  Y: "/waɪ/",
  Z: "/ziː/ (US), /zɛd/ (UK)"
};

const letterExample = {
  A: "apple",
  B: "book",
  C: "cat",
  D: "dog",
  E: "egg",
  F: "fish",
  G: "go",
  H: "hat",
  I: "ice",
  J: "jam",
  K: "kite",
  L: "lion",
  M: "moon",
  N: "nose",
  O: "orange",
  P: "pen",
  Q: "queen",
  R: "rain",
  S: "sun",
  T: "table",
  U: "umbrella",
  V: "van",
  W: "water",
  X: "x-ray",
  Y: "yellow",
  Z: "zoo"
};

/***********************
 * 3) SPEECH SYNTHESIS
 ***********************/
const SAY_SPACE = false;

const $word = document.getElementById("word");
const $result = document.getElementById("result");
const $status = document.getElementById("status");

const $btnShow = document.getElementById("btnShow");
const $btnClear = document.getElementById("btnClear");

const $btnSpeakWord = document.getElementById("btnSpeakWord");
const $btnDictation = document.getElementById("btnDictation");
const $btnStop = document.getElementById("btnStop");

const $voice = document.getElementById("voice");
const $rate = document.getElementById("rate");
const $pitch = document.getElementById("pitch");
const $pause = document.getElementById("pause");
const $rateLabel = document.getElementById("rateLabel");
const $pitchLabel = document.getElementById("pitchLabel");
const $pauseLabel = document.getElementById("pauseLabel");

const $btnYwai = document.getElementById("btnYwai");
const $btnYyei = document.getElementById("btnYyei");

const $btnPrint = document.getElementById("btnPrint");
const $btnCopyTable = document.getElementById("btnCopyTable");

const $alphaBody = document.getElementById("alphaBody");

let voices = [];
let dictationToken = 0;

function setStatus(msg){
  $status.innerHTML = `<b>Estado:</b> ${msg}`;
}

function normalizeInput(text) {
  return text
    .trim()
    .replace(/[.,;:!?()"'’]/g, "")
    .replace(/-/g, " ")
    .replace(/\s+/g, " ");
}

function getSelectedVoice(){
  const idx = Number($voice.value);
  if (!Number.isFinite(idx) || !voices[idx]) return null;
  return voices[idx];
}

function speakText(text, {voice=null, rate=1, pitch=1} = {}){
  if (!("speechSynthesis" in window)) {
    setStatus(`Tu navegador no soporta speechSynthesis. (Prueba Chrome/Edge)`);
    return Promise.reject(new Error("speechSynthesis not supported"));
  }
  window.speechSynthesis.cancel();

  return new Promise((resolve, reject) => {
    const utter = new SpeechSynthesisUtterance(text);
    if (voice) utter.voice = voice;
    utter.rate = rate;
    utter.pitch = pitch;

    utter.onend = () => resolve();
    utter.onerror = (e) => reject(e);

    window.speechSynthesis.speak(utter);
  });
}

function stopAll(){
  dictationToken++;
  if ("speechSynthesis" in window) window.speechSynthesis.cancel();
  clearActiveCells();
  setStatus("detenido.");
}

function clearActiveCells(){
  document.querySelectorAll(".cell.active").forEach(el => el.classList.remove("active"));
}

function buildCells(chars){
  return chars.map((ch, i) => {
    if (ch === " ") return { type:"space", raw: ch, index: i };
    const up = ch.toUpperCase();
    if (/[A-Z]/.test(up)) return { type:"letter", raw: up, index: i, pron: letterPron[up] || "?", ipa: letterIPA[up] || "" };
    return { type:"other", raw: ch, index: i };
  });
}

function renderWord(raw) {
  const cleaned = normalizeInput(raw);
  if (!cleaned) {
    $result.innerHTML = `<div class="inline">Escribe una palabra para ver el spelling.</div>`;
    return;
  }

  const chars = cleaned.split("");
  const cells = buildCells(chars);

  const gridHTML = `
    <div class="grid" id="grid">
      ${cells.map(c => {
        if (c.type === "space") {
          return `<div class="cell" data-index="${c.index}" style="background:transparent;border:1px solid transparent;min-height:78px;"></div>`;
        }
        if (c.type === "letter") {
          return `
            <div class="cell" data-index="${c.index}" role="button" tabindex="0" title="Clic para escuchar la letra">
              <div class="letter">${c.raw}</div>
              <div class="pron">(${c.pron})</div>
              <div class="sub">${c.ipa}</div>
            </div>
          `;
        }
        return `
          <div class="cell" data-index="${c.index}">
            <div class="letter">${c.raw}</div>
            <div class="pron"></div>
            <div class="sub"></div>
          </div>
        `;
      }).join("")}
    </div>
  `;

  const spelledLine = chars
    .map(ch => (ch === " " ? " / " : ch.toUpperCase()))
    .join(" - ")
    .replace(/- \/-/g, "/");

  const inlineExplain = `
    <div class="inline">
      <div><b>Spelling:</b> <span class="mono">${spelledLine}</span></div>
      <div style="margin-top:6px;">
        <b>Ejemplo:</b> <span class="mono">HAPPY</span> → <span class="mono">H - A - P - P - Y</span>
      </div>
    </div>
  `;

  $result.innerHTML = gridHTML + inlineExplain;

  const grid = document.getElementById("grid");
  grid.addEventListener("click", async (e) => {
    const cell = e.target.closest(".cell");
    if (!cell) return;
    const idx = Number(cell.getAttribute("data-index"));
    const item = cells.find(x => x.index === idx);
    if (!item || item.type !== "letter") return;

    try{
      clearActiveCells();
      cell.classList.add("active");
      const v = getSelectedVoice();
      await speakText(item.raw, {
        voice: v,
        rate: Number($rate.value),
        pitch: Number($pitch.value),
      });
      cell.classList.remove("active");
    }catch(err){
      cell.classList.remove("active");
      setStatus("error al reproducir audio. (A veces el navegador bloquea audio si no hubo interacción previa)");
    }
  }, { once: true });
}

async function speakSpelling(){
  const cleaned = normalizeInput($word.value);
  if (!cleaned) return setStatus("escribe una palabra primero.");

  const v = getSelectedVoice();
  const rate = Number($rate.value);
  const pitch = Number($pitch.value);
  const pauseMs = Number($pause.value);

  const chars = cleaned.toUpperCase().split("");
  const cells = buildCells(chars);
  const token = ++dictationToken;

  setStatus(`reproduciendo spelling...`);

  for (let i = 0; i < cells.length; i++){
    if (token !== dictationToken) return;
    const c = cells[i];
    const cellEl = document.querySelector(`.cell[data-index="${c.index}"]`);

    if (c.type === "space"){
      if (SAY_SPACE){
        await speakText("space", { voice: v, rate, pitch }).catch(()=>{});
      }
      await sleep(pauseMs);
      continue;
    }

    if (c.type === "letter"){
      clearActiveCells();
      if (cellEl) cellEl.classList.add("active");
      await speakText(c.raw, { voice: v, rate, pitch }).catch(()=>{});
      if (cellEl) cellEl.classList.remove("active");
      await sleep(pauseMs);
    }
  }

  setStatus(`listo: spelling terminado.`);
}

async function startDictation(){
  const cleaned = normalizeInput($word.value);
  if (!cleaned) return setStatus("escribe una palabra primero.");

  const v = getSelectedVoice();
  const rate = Number($rate.value);
  const pitch = Number($pitch.value);
  const pauseMs = Number($pause.value);

  const chars = cleaned.toUpperCase().split("");
  const cells = buildCells(chars);

  renderWord(cleaned);

  const token = ++dictationToken;
  setStatus(`dictado en curso... (pausa ${pauseMs}ms)`);

  await speakText(cleaned, { voice: v, rate, pitch }).catch(()=>{});
  await sleep(Math.max(350, pauseMs));

  for (let i = 0; i < cells.length; i++){
    if (token !== dictationToken) return;

    const c = cells[i];
    const cellEl = document.querySelector(`.cell[data-index="${c.index}"]`);

    if (c.type === "space"){
      clearActiveCells();
      if (SAY_SPACE) await speakText("space", { voice: v, rate, pitch }).catch(()=>{});
      await sleep(pauseMs);
      continue;
    }

    if (c.type === "letter"){
      clearActiveCells();
      if (cellEl) cellEl.classList.add("active");

      await speakText(c.raw, { voice: v, rate, pitch }).catch(()=>{});
      await sleep(Math.min(250, pauseMs));
      if (token !== dictationToken) return;
      await speakText(c.raw, { voice: v, rate, pitch }).catch(()=>{});

      if (cellEl) cellEl.classList.remove("active");
      await sleep(pauseMs);
    }
  }

  setStatus("dictado terminado.");
}

function sleep(ms){ return new Promise(r => setTimeout(r, ms)); }

function loadVoices(){
  if (!("speechSynthesis" in window)) {
    $voice.innerHTML = `<option value="-1">SpeechSynthesis no disponible</option>`;
    return;
  }

  voices = window.speechSynthesis.getVoices() || [];
  const english = voices
    .map((v, i) => ({ v, i }))
    .filter(x => (x.v.lang || "").toLowerCase().startsWith("en"));

  const list = english.length ? english : voices.map((v,i)=>({v,i}));

  $voice.innerHTML = list.map((x) => {
    const name = `${x.v.name} (${x.v.lang})`;
    return `<option value="${x.i}">${name}</option>`;
  }).join("");

  if (list.length){
    $voice.value = String(list[0].i);
    setStatus(`voces cargadas: ${english.length ? "preferencia inglés" : "no se detectó inglés, usando lista general"}.`);
  } else {
    setStatus("no se encontraron voces. (En algunos sistemas hay que instalar voces en el SO)");
  }
}

if ("speechSynthesis" in window) {
  window.speechSynthesis.onvoiceschanged = () => loadVoices();
}
setTimeout(loadVoices, 200);
setTimeout(loadVoices, 1200);

function renderAlphabetTable(){
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
  $alphaBody.innerHTML = letters.map(L => {
    const pron = letterPron[L] || "?";
    const ipa = letterIPA[L] || "";
    const ex = letterExample[L] || "";
    return `
      <tr>
        <td class="tdLetter">${L}</td>
        <td class="tdPron">(${pron})</td>
        <td class="tdIpa">${ipa}</td>
        <td>${ex}</td>
        <td>
          <button class="secondary" data-say="${L}" style="padding:8px 10px; border-radius:10px;">🔊</button>
        </td>
      </tr>
    `;
  }).join("");

  $alphaBody.querySelectorAll("button[data-say]").forEach(btn => {
    btn.addEventListener("click", async () => {
      const L = btn.getAttribute("data-say");
      try{
        setStatus(`reproduciendo: ${L}`);
        await speakText(L, { voice: getSelectedVoice(), rate: Number($rate.value), pitch: Number($pitch.value) });
        setStatus("listo.");
      }catch{
        setStatus("no se pudo reproducir audio.");
      }
    });
  });
}

function copyAlphabetTableAsText(){
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
  const lines = letters.map(L => `${L}\t(${letterPron[L] || "?"})\t${letterIPA[L] || ""}\t${letterExample[L] || ""}`);
  const header = "Letra\tPronunciación\tIPA\tEjemplo";
  const text = [header, ...lines].join("\n");

  navigator.clipboard?.writeText(text)
    .then(()=> setStatus("tabla copiada al portapapeles. (Pégala en Word/Docs/Excel)"))
    .catch(()=> setStatus("no se pudo copiar (tu navegador puede bloquearlo)."));
}

/***********************
 * 8) Eventos UI
 ***********************/
$btnShow.addEventListener("click", () => renderWord($word.value));
$word.addEventListener("keydown", (e) => { if (e.key === "Enter") renderWord($word.value); });

$btnClear.addEventListener("click", () => {
  stopAll();
  $word.value = "";
  $word.focus();
  renderWord("");
});

$btnSpeakWord.addEventListener("click", () => speakSpelling());
$btnDictation.addEventListener("click", () => startDictation());
$btnStop.addEventListener("click", () => stopAll());

$rate.addEventListener("input", () => $rateLabel.textContent = Number($rate.value).toFixed(1));
$pitch.addEventListener("input", () => $pitchLabel.textContent = Number($pitch.value).toFixed(1));
$pause.addEventListener("input", () => $pauseLabel.textContent = String($pause.value));

if ($btnYwai) {
  $btnYwai.addEventListener("click", () => {
    letterPron.Y = "wai";
    renderWord($word.value);
    renderAlphabetTable();
    setStatus('actualizado: Y = "wai"');
  });
}

if ($btnYyei) {
  $btnYyei.addEventListener("click", () => {
    letterPron.Y = "yei";
    renderWord($word.value);
    renderAlphabetTable();
    setStatus('actualizado: Y = "yei"');
  });
}


$btnPrint.addEventListener("click", () => window.print());
$btnCopyTable.addEventListener("click", () => copyAlphabetTableAsText());

/***********************
 * 9) Demo inicial
 ***********************/
$word.value = "HAPPY";
$rateLabel.textContent = Number($rate.value).toFixed(1);
$pitchLabel.textContent = Number($pitch.value).toFixed(1);
$pauseLabel.textContent = String($pause.value);

document.addEventListener("DOMContentLoaded", () => {
  $word.value = "HAPPY";

  $rateLabel.textContent = Number($rate.value).toFixed(1);
  $pitchLabel.textContent = Number($pitch.value).toFixed(1);
  $pauseLabel.textContent = String($pause.value);

  renderWord($word.value);
  renderAlphabetTable();

  if (!("speechSynthesis" in window)) {
    setStatus("Tu navegador no soporta speechSynthesis. Prueba Chrome o Edge en PC.");
  }
});
