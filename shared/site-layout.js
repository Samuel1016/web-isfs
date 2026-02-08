// Mobile nav toggle (igual que en tu app.js principal)
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
  dropdownMenu?.classList.remove("is-open");
  dropdownBtn?.setAttribute("aria-expanded", "false");
});
