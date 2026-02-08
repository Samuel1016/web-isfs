// Year in footer
document.getElementById("year").textContent = new Date().getFullYear();

// Mobile nav toggle
const navToggle = document.getElementById("navToggle");
const nav = document.getElementById("nav");

navToggle?.addEventListener("click", () => {
  const open = nav.classList.toggle("is-open");
  navToggle.setAttribute("aria-expanded", open ? "true" : "false");
});

// Dropdown toggle
const dropdownBtn = document.querySelector(".dropdown__btn");
const dropdownMenu = document.querySelector(".dropdown__menu");

dropdownBtn?.addEventListener("click", (e) => {
  e.stopPropagation();
  const open = dropdownMenu.classList.toggle("is-open");
  dropdownBtn.setAttribute("aria-expanded", open ? "true" : "false");
});

// Close dropdown when clicking outside
document.addEventListener("click", () => {
  if (!dropdownMenu) return;
  dropdownMenu.classList.remove("is-open");
  dropdownBtn?.setAttribute("aria-expanded", "false");
});

// Example behavior: when clicking a system item
const systemTitle = document.getElementById("systemTitle");
const systemDesc = document.getElementById("systemDesc");

document.querySelectorAll("[data-system]").forEach((a) => {
  a.addEventListener("click", () => {
    const sys = a.getAttribute("data-system");

    // This is just a placeholder. Later you can do:
    // window.location.href = `sistemas/${sys}.html`
    // OR set an iframe src.

    const map = {
      pitagoras: {
        title: "Teorema de Pitágoras",
        desc: "Aquí podríamos cargar tu sistema de Pitágoras como otra página o dentro de un iframe.",
      },
      spelling: {
        title: "Spelling English",
        desc: "Aquí podríamos cargar tu sistema de Spelling English como otra página o dentro de un iframe.",
      },
      juegos: {
        title: "Juegos Matemáticos",
        desc: "Aquí podríamos cargar tu sistema de juegos como otra página o dentro de un iframe.",
      },
      sumas: {
        title: "Sumas y Restas",
        desc: "Aquí podríamos cargar tu sistema de sumas y restas como otra página o dentro de un iframe.",
      },
    };

    const item = map[sys] || { title: "Sistema", desc: "Sistema seleccionado." };
    if (systemTitle) systemTitle.textContent = item.title;
    if (systemDesc) systemDesc.textContent = item.desc;

    // Close menus on mobile after click
    dropdownMenu?.classList.remove("is-open");
    nav?.classList.remove("is-open");
    navToggle?.setAttribute("aria-expanded", "false");
  });
});

// Simple contact form validation (frontend only)
const form = document.getElementById("contactForm");
const msg = document.getElementById("formMsg");

form?.addEventListener("submit", (e) => {
  e.preventDefault();

  const data = new FormData(form);
  const name = (data.get("name") || "").toString().trim();
  const email = (data.get("email") || "").toString().trim();
  const message = (data.get("message") || "").toString().trim();

  if (!name || !email || !message) {
    if (msg) msg.textContent = "Por favor completa Nombre, Correo y Mensaje.";
    return;
  }

  // No backend: simulate success
  if (msg) msg.textContent = "Listo. Tu mensaje fue validado (demo sin envío real).";
  form.reset();
});
