const LOGIN_API = "https://script.google.com/macros/s/AKfycbxYYu2xP5mNkJH9RDVycHAIySJLen-igd40Oet7V46MUJ20zQan228vVVKhFFovXvI/exec";

async function login() {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();
  const errorEl = document.getElementById("error");

  errorEl.textContent = "";

  // Validación básica frontend
  if (!email.endsWith("@legendsbot.com")) {
    errorEl.textContent = "Email no autorizado";
    return;
  }

  if (!password) {
    errorEl.textContent = "Ingresá la contraseña";
    return;
  }

  try {
    const res = await fetch(LOGIN_API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (!data.ok) {
      errorEl.textContent = data.error;
      return;
    }

    // Guardar sesión
    localStorage.setItem("legendsUser", JSON.stringify(data.user));

    // Redirigir a la app
    window.location.href = "index.html";

  } catch (err) {
    errorEl.textContent = "Error de conexión";
  }
}