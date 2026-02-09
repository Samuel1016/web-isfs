// shared/systems-catalog.js
(() => {
  function esc(str){
    return String(str ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function renderCatalog(){
    const mount = document.getElementById("systemsCatalog");
    if (!mount) return;

    const list = Array.isArray(window.ISFS_SYSTEMS) ? window.ISFS_SYSTEMS : [];
    if (!list.length){
      mount.innerHTML = `<div class="sysEmpty">Aún no hay sistemas publicados.</div>`;
      return;
    }

    mount.innerHTML = list.map(sys => {
      const tags = (sys.tags || []).slice(0, 3).map(t => `<span class="sysTag">${esc(t)}</span>`).join("");
      return `
        <a class="sysCard" href="${esc(sys.href)}">
          <div class="sysIcon" aria-hidden="true">${esc(sys.icon || "🧩")}</div>
          <div class="sysBody">
            <div class="sysTitle">${esc(sys.title)}</div>
            <div class="sysDesc">${esc(sys.desc)}</div>
            <div class="sysTags">${tags}</div>
          </div>
          <div class="sysArrow" aria-hidden="true">→</div>
        </a>
      `;
    }).join("");
  }

  document.addEventListener("DOMContentLoaded", renderCatalog);
})();
