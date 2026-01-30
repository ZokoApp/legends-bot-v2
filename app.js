// =========================
// CONFIG
// =========================
const API = "https://subpreputial-hypersuggestible-leonie.ngrok-free.dev";

let lastImageUrl = "";
let lastTextResult = "";
let currentNoteIndex = null;
let currentMode = null;

// =========================
// HISTORIAL
// =========================
function getHistory() {
  return JSON.parse(localStorage.getItem("legends_history") || "[]");
}

function saveHistory(item) {
  const history = getHistory();
  history.unshift(item);
  if (history.length > 30) history.pop();
  localStorage.setItem("legends_history", JSON.stringify(history));
}

function updateHistory(history) {
  localStorage.setItem("legends_history", JSON.stringify(history));
}

function openHistory() {
  const list = document.getElementById("historyList");
  const history = getHistory();
  list.innerHTML = "";

  if (history.length === 0) {
    list.innerHTML = "<p style='color:#888'>Sin consultas aún</p>";
    document.getElementById("historyModal").style.display = "flex";
    return;
  }

  history.forEach((h, i) => {
    const div = document.createElement("div");
    div.style.marginBottom = "14px";
    div.innerHTML = `
      <strong>${h.fecha}</strong><br>
      ${h.modo}<br>
      ${h.datos.direccion || h.datos.rut || ""}<br>
      ${h.nota ? `<em>📝 ${h.nota}</em><br>` : ""}
      <button onclick="viewHistory(${i})">Ver</button>
      <button onclick="repeatHistory(${i})">Repetir</button>
      <button onclick="editNote(${i})">Nota</button>
      <hr>
    `;
    list.appendChild(div);
  });

  document.getElementById("historyModal").style.display = "flex";
}

function closeHistory() {
  document.getElementById("historyModal").style.display = "none";
}

function viewHistory(i) {
  const h = getHistory()[i];
  openResultModal(h.resultado, h.imagen);
}

function repeatHistory(i) {
  const h = getHistory()[i];
  company.value = h.datos.company;
  mode.value = h.modo;
  address.value = h.datos.direccion || "";
  comuna.value = h.datos.comuna || "";
  rut.value = h.datos.rut || "";
  closeHistory();
}

// =========================
// NOTAS
// =========================
function editNote(i) {
  const history = getHistory();
  currentNoteIndex = i;
  noteText.value = history[i].nota || "";
  noteModal.style.display = "flex";
}

function saveNote() {
  const history = getHistory();
  history[currentNoteIndex].nota = noteText.value.trim();
  updateHistory(history);
  closeNote();
  openHistory();
}

function closeNote() {
  noteModal.style.display = "none";
}

// =========================
// MODAL RESULTADO
// =========================
function openResultModal(text, imageUrl) {
  lastTextResult = text || "";
  lastImageUrl = imageUrl || "";

  if (lastTextResult.startsWith("http")) {
    modalText.innerHTML = `
      <div style="text-align:center;">
        <p>Boleta disponible</p>
        <a href="${lastTextResult}" target="_blank"
           style="display:inline-block;margin-top:12px;padding:12px 20px;background:#3b82f6;color:white;border-radius:10px;text-decoration:none;font-weight:600;">
          🔎 Ver boleta
        </a>
      </div>
    `;
  } else {
    modalText.innerText = lastTextResult;
  }

  modalImg.src = lastImageUrl || "";
  resultModal.style.display = "flex";
}

function closeResultModal() {
  resultModal.style.display = "none";
}

function shareWhatsApp() {
  let msg = lastTextResult;
  if (lastImageUrl) msg += "\n\n📸 " + lastImageUrl;
  window.open("https://wa.me/?text=" + encodeURIComponent(msg), "_blank");
}

async function downloadPDF() {
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF();
  const lines = pdf.splitTextToSize(lastTextResult, 180);
  pdf.text(lines, 10, 10);
  let y = 10 + lines.length * 6 + 10;

  if (lastImageUrl) {
    const imgData = await fetch(lastImageUrl).then(r => r.blob()).then(b => new Promise(res => {
      const reader = new FileReader();
      reader.onload = () => res(reader.result);
      reader.readAsDataURL(b);
    }));
    pdf.addImage(imgData, "PNG", 10, y, 180, 100);
  }

  pdf.save("resultado_legends_bot.pdf");
}

// =========================
// UTILS
// =========================
const sleep = ms => new Promise(res => setTimeout(res, ms));
const setStatus = t => statusText.textContent = t;

// =========================
// MODOS POR BOTONES
// =========================
function openMode(modeName){
  currentMode = modeName;
  mode.value = modeName;

  const titles = {
    factibilidad:"🧪 Factibilidad Técnica",
    validacion:"💰 Estado de Venta",
    agenda:"📅 Agenda",
    boleta:"🧾 Boleta / Factura"
  };

  modeTitle.innerText = titles[modeName];

  if (modeName === "factibilidad") {
    modeBody.innerHTML = `
      <input id="m_address" placeholder="Dirección">
      <input id="m_comuna" placeholder="Comuna">
    `;
  } else {
    modeBody.innerHTML = `<input id="m_rut" placeholder="RUT">`;
  }

  modeModal.style.display = "flex";
}

function closeMode(){
  modeModal.style.display = "none";
}

function runFromModal(){
  if (currentMode === "factibilidad") {
    address.value = m_address.value;
    comuna.value = m_comuna.value;
  } else {
    rut.value = m_rut.value;
  }
  closeMode();
  btnRun.click();
}
