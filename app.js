// =========================
// CONFIG
// =========================
const API = "https://unreproached-subangularly-cristopher.ngrok-free.dev";

let lastImageUrl = "";
let lastTextResult = "";
let currentNoteIndex = null;

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
  const list = historyList;
  const history = getHistory();
  list.innerHTML = "";

  if (history.length === 0) {
    list.innerHTML = "<p style='color:#888'>Sin consultas aún</p>";
    historyModal.style.display = "flex";
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

  historyModal.style.display = "flex";
}

function closeHistory() {
  historyModal.style.display = "none";
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

  const modoActual = mode.value;

  // 🔥 Separar técnica y comercial si es factibilidad
  let tecnico = lastTextResult;
  let comercial = "";
  let tieneComercial = false;

  if (modoActual === "factibilidad" && lastTextResult.includes("VALIDACIONES COMERCIALES")) {
    const partes = lastTextResult.split("VALIDACIONES COMERCIALES");
    tecnico = partes[0] || "";
    comercial = "VALIDACIONES COMERCIALES\n" + (partes[1] || "");
    tieneComercial = true;
  }

  // ========================
  // BOLETA (link)
  // ========================
  if (typeof lastTextResult === "string" && lastTextResult.startsWith("http")) {

    modalText.innerHTML = `
      <div style="text-align:center;">
        <p>Boleta disponible</p>
        <a href="${lastTextResult}" target="_blank"
           style="display:inline-block;margin-top:12px;padding:12px 20px;background:#3b82f6;color:white;border-radius:10px;text-decoration:none;font-weight:600;">
          🔎 Ver boleta
        </a>
      </div>
    `;

    const btn = document.getElementById("toggleViewBtn");
    if (btn) btn.style.display = "none";
  }

  else {

    modalText.innerText = tecnico;

    const btn = document.getElementById("toggleViewBtn");

    if (btn) {

      if (tieneComercial) {
        btn.style.display = "block";
        btn.innerText = "Ver Validaciones Comerciales";
      } else {
        btn.style.display = "none";
      }

      btn.onclick = () => {

        if (modalText.innerText === tecnico) {
          modalText.innerText = comercial;
          btn.innerText = "Volver a Factibilidad Técnica";
        } else {
          modalText.innerText = tecnico;
          btn.innerText = "Ver Validaciones Comerciales";
        }

      };
    }
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
    const imgData = await fetch(lastImageUrl)
      .then(r => r.blob())
      .then(b => new Promise(res => {
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
// EJECUTAR (BLINDADO)
// =========================
btnRun.addEventListener("click", async () => {

  // 🔥 FUENTE DE VERDAD: DOM
  const companyValue = company.value;
  const modeValue    = mode.value;

  const direccionValue = address.value.trim();
  const comunaValue    = comuna.value.trim();
  const rutValue       = rut.value.trim();

  console.log("EJECUTANDO", { companyValue, modeValue });

  showWorkMode();
  setStatus("⏳ Enviando consulta a Legends…");

  try {
    let pollUrl = null;

    // =========================
    // BOLETA
    // =========================
    if (modeValue === "boleta") {
      if (!rutValue) {
        hideWorkMode();
        return setStatus("🔴 Falta el RUT");
      }

      const start = await fetch(`${API}/boleta`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true"
        },
        body: JSON.stringify({
          rut: rutValue,
          company: companyValue
        })
      });

      const data = await start.json();
      pollUrl = `${API}/boleta/${data.jobId}`;
    }

    // =========================
    // FACTIBILIDAD
    // =========================
    if (modeValue === "factibilidad") {
      if (!direccionValue || !comunaValue) {
        hideWorkMode();
        return setStatus("🔴 Falta dirección o comuna");
      }

      const start = await fetch(`${API}/factibilidad`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true"
        },
        body: JSON.stringify({
          direccion: direccionValue,
          comuna: comunaValue,
          company: companyValue,
          email: user.email
        })
      });

      const data = await start.json();
      pollUrl = `${API}/factibilidad/${data.jobId}`;
    }

    // =========================
    // AGENDA
    // =========================
    if (modeValue === "agenda") {
      if (!rutValue) {
        hideWorkMode();
        return setStatus("🔴 Falta el RUT");
      }

      const start = await fetch(`${API}/agenda`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true"
        },
        body: JSON.stringify({
          rut: rutValue,
          company: companyValue,
          email: user.email
        })
      });

      const data = await start.json();
      pollUrl = `${API}/agenda/${data.jobId}`;
    }

    // =========================
    // ESTADO DE VENTA
    // =========================
    if (modeValue === "validacion") {
      if (!rutValue) {
        hideWorkMode();
        return setStatus("🔴 Falta el RUT");
      }

      const start = await fetch(`${API}/estado-rut`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true"
        },
        body: JSON.stringify({
          rut: rutValue,
          company: companyValue,
          email: user.email
        })
      });

      const data = await start.json();
      pollUrl = `${API}/estado-rut/${data.jobId}`;
    }

    if (!pollUrl) {
      hideWorkMode();
      return setStatus("🔴 Modo inválido");
    }

    setStatus("🟡 Ejecutando en Legends…");

    while (true) {
      await sleep(2000);
      const poll = await fetch(pollUrl, {
        headers: { "ngrok-skip-browser-warning": "true" }
      });

      const result = await poll.json();

      if (result.status === "queued" || result.status === "running") continue;

      hideWorkMode();

      if (result.status === "error") {
        setStatus("🔴 Error");
        openResultModal(result.error || "Error desconocido", "");
        return;
      }

      if (result.status === "done") {
        setStatus("🟢 Finalizado");

        saveHistory({
          fecha: new Date().toLocaleString(),
          modo: modeValue,
          datos: {
            direccion: direccionValue,
            comuna: comunaValue,
            rut: rutValue,
            company: companyValue
          },
          resultado: result.resultado || "",
          imagen: result.capturaUrl || "",
          nota: ""
        });

        openResultModal(result.resultado, result.capturaUrl);
        return;
      }
    }

  } catch (e) {
    hideWorkMode();
    setStatus("🔴 Error");
    openResultModal(e.message, "");
  }
});

