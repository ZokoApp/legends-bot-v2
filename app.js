
// =========================
// CONFIG
// =========================
const API = "https://subpreputial-hypersuggestible-leonie.ngrok-free.dev";

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
  document.getElementById("company").value = h.datos.company;
  document.getElementById("mode").value = h.modo;
  document.getElementById("address").value = h.datos.direccion || "";
  document.getElementById("comuna").value = h.datos.comuna || "";
  document.getElementById("rut").value = h.datos.rut || "";
  closeHistory();
}

// =========================
// NOTAS
// =========================
function editNote(i) {
  const history = getHistory();
  currentNoteIndex = i;
  document.getElementById("noteText").value = history[i].nota || "";
  document.getElementById("noteModal").style.display = "flex";
}

function saveNote() {
  const history = getHistory();
  history[currentNoteIndex].nota = document.getElementById("noteText").value.trim();
  updateHistory(history);
  closeNote();
  openHistory();
}

function closeNote() {
  document.getElementById("noteModal").style.display = "none";
}

// =========================
// MODAL RESULTADO
// =========================
function openResultModal(text, imageUrl) {
  lastTextResult = text || "";
  lastImageUrl = imageUrl || "";

  const modalText = document.getElementById("modalText");

  // si es un link, mostrar botón
  if (lastTextResult.startsWith("http")) {
    modalText.innerHTML = `
      <div style="text-align:center;">
        <p>Boleta disponible</p>
        <a href="${lastTextResult}" target="_blank"
           style="
             display:inline-block;
             margin-top:12px;
             padding:12px 20px;
             background:#3b82f6;
             color:white;
             border-radius:10px;
             text-decoration:none;
             font-weight:600;
           ">
          🔎 Ver boleta
        </a>
      </div>
    `;
  } else {
    modalText.innerText = lastTextResult;
  }

  document.getElementById("modalImg").src = lastImageUrl || "";
  document.getElementById("resultModal").style.display = "flex";
}

function closeResultModal() {
  document.getElementById("resultModal").style.display = "none";
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
function sleep(ms) {
  return new Promise(res => setTimeout(res, ms));
}

function setStatus(text) {
  statusText.textContent = text;
}

// =========================
// LIMPIAR
// =========================
btnClear.addEventListener("click", () => {
  setStatus("🟢 Conectado a Legends Bot");
});

// =========================
// EJECUTAR
// =========================
btnRun.addEventListener("click", async () => {

  const companyValue = document.getElementById("company").value;
  const modeValue = document.getElementById("mode").value;
  const direccionValue = document.getElementById("address").value.trim();
  const comunaValue = document.getElementById("comuna").value.trim();
  const rutValue = document.getElementById("rut").value.trim();

  setStatus("⏳ Enviando consulta a Legends…");
  showWorkMode();

  try {
    let pollUrl = null;

    if (modeValue === "boleta") {
      if (!rutValue) {
        hideWorkMode();
        return setStatus("🔴 Falta el RUT");
      }

      const start = await fetch(`${API}/boleta`, {
        method: "POST",
        headers: {"Content-Type":"application/json","ngrok-skip-browser-warning":"true"},
        body: JSON.stringify({ rut: rutValue, company: companyValue })
      });

      if (!start.ok) {
        hideWorkMode();
        return openResultModal("Backend no tiene /boleta implementado", "");
      }

      const data = await start.json();
      pollUrl = `${API}/boleta/${data.jobId}`;
    }
    // =========================
// FACTIBILIDAD TÉCNICA
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

  if (!start.ok) {
    hideWorkMode();
    return openResultModal("Backend no tiene /factibilidad implementado", "");
  }

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

  if (!start.ok) {
    hideWorkMode();
    return openResultModal("Backend no tiene /agenda implementado", "");
  }

  const data = await start.json();
  pollUrl = `${API}/agenda/${data.jobId}`;
}
    
    // =========================
// ESTADO DE VENTA (VALIDACION)
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

  if (!start.ok) {
    hideWorkMode();
    return openResultModal("Backend no tiene /estado-rut implementado", "");
  }

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
      const poll = await fetch(pollUrl, { headers: {"ngrok-skip-browser-warning":"true"} });
      const result = await poll.json();

      if (result.status === "queued" || result.status === "running") continue;

      if (result.status === "error") {
        hideWorkMode();
        setStatus("🔴 Error");
        openResultModal(result.error || "Error desconocido", "");
        return;
      }

      if (result.status === "done") {
        hideWorkMode();
        setStatus("🟢 Finalizado");

        saveHistory({
          fecha: new Date().toLocaleString(),
          modo: modeValue,
          datos: { direccion: direccionValue, comuna: comunaValue, rut: rutValue, company: companyValue },
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
