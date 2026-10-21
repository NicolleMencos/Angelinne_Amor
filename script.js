// ===== Estrellas flotantes =====
function initStars() {
  const stars = document.querySelector(".stars");
  if (!stars) return;

  for (let i = 0; i < 10; i++) {
    const star = document.createElement("span");
    star.textContent = i % 3 === 0 ? "✧" : "·";
    star.style.position = "absolute";
    star.style.left = `${Math.random() * 100}%`;
    star.style.top = `${Math.random() * 100}%`;
    star.style.color = "#c8a9ff";
    star.style.opacity = `${0.2 + Math.random() * 0.5}`;
    star.style.fontSize = `${10 + Math.random() * 15}px`;
    star.style.animation = `float ${3 + Math.random() * 5}s ease-in-out infinite`;
    star.style.animationDelay = `${Math.random() * 3}s`;
    stars.appendChild(star);
  }
}

// ===== Enlaces internos con scroll suave (#inicio, etc.) =====
document.addEventListener("click", (event) => {
  const link = event.target.closest('a[href^="#"]');
  if (!link) return;

  const target = document.querySelector(link.getAttribute("href"));
  if (target) {
    event.preventDefault();
    target.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth"
    });
  }
});

document.addEventListener("DOMContentLoaded", initStars);

// ===== Navegación sin recargar (para que la música no se corte) =====
(() => {
  const KEEP = ":not(.music-btn):not(.welcome-overlay)";

  async function goTo(url, push = true) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error("No se pudo cargar");
      const html = await res.text();
      const doc = new DOMParser().parseFromString(html, "text/html");

      document.title = doc.title;
      document.body.className = doc.body.className;

      document.querySelectorAll(`body > *${KEEP}`).forEach((el) => el.remove());
      [...doc.body.children].forEach((el) => {
        if (el.tagName !== "SCRIPT") document.body.appendChild(el);
      });

      if (push) history.pushState({}, "", url);
      window.scrollTo(0, 0);
      initStars();
    } catch (err) {
      location.href = url; // respaldo: navegación normal
    }
  }

  document.addEventListener("click", (event) => {
    if (event.defaultPrevented || event.button !== 0) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

    const link = event.target.closest("a[href]");
    if (!link || link.target === "_blank" || link.hasAttribute("download")) return;

    const url = new URL(link.href, location.href);
    const isSameSite = url.origin === location.origin;
    const isPage = url.pathname.endsWith(".html") || url.pathname.endsWith("/");
    const isOnlyHash = url.pathname === location.pathname && url.hash;

    if (!isSameSite || !isPage || isOnlyHash) return;

    event.preventDefault();
    goTo(url.href);
  });

  window.addEventListener("popstate", () => goTo(location.href, false));
})();

// ===== Música de fondo =====
(() => {
  const MUSIC_SRC = "musica/cancion.mp3"; // cambia el nombre si tu archivo se llama distinto
  const VOLUME = 0.6;
  const K_STATE = "musica-estado"; // "on" | "off"
  const K_TIME = "musica-tiempo";

  const audio = new Audio(MUSIC_SRC);
  audio.loop = true;
  audio.volume = VOLUME;
  audio.preload = "auto";

  // Respaldo: si la página se recarga, retoma donde se quedó
  const savedTime = parseFloat(sessionStorage.getItem(K_TIME)) || 0;
  audio.addEventListener("loadedmetadata", () => {
    if (savedTime && savedTime < audio.duration) audio.currentTime = savedTime;
  });

  const saveTime = () => sessionStorage.setItem(K_TIME, audio.currentTime);
  setInterval(() => { if (!audio.paused) saveTime(); }, 500);
  window.addEventListener("pagehide", saveTime);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) saveTime();
  });

  // Botón flotante de música
  const btn = document.createElement("button");
  btn.className = "music-btn";
  btn.type = "button";
  btn.setAttribute("aria-label", "Pausar o reproducir música");
  const refreshBtn = () =>
    (btn.textContent = audio.paused ? "▶ REPRODUCIR MÚSICA" : "⏸ PAUSAR MÚSICA");

  btn.addEventListener("click", () => {
    if (audio.paused) {
      audio.play();
      sessionStorage.setItem(K_STATE, "on");
    } else {
      audio.pause();
      sessionStorage.setItem(K_STATE, "off");
    }
  });
  audio.addEventListener("play", refreshBtn);
  audio.addEventListener("pause", refreshBtn);

  const state = sessionStorage.getItem(K_STATE);

  const init = () => {
    document.body.appendChild(btn);
    refreshBtn();

    if (state === "on") {
      audio.play().catch(() => {
        const resume = () => {
          audio.play();
          window.removeEventListener("pointerdown", resume);
        };
        window.addEventListener("pointerdown", resume);
      });
    } else if (state === null) {
      const overlay = document.createElement("div");
      overlay.className = "welcome-overlay";
      overlay.innerHTML = `
        <div class="welcome-box">
          <div class="welcome-emoji">👑🐣</div>
          <h2>Hecho con cariño<br>para ti</h2>
          <p>Ponte cómoda, sube el volumen y toca el botón 💜</p>
          <button type="button" class="welcome-btn">Toca para entrar ♡</button>
        </div>`;
      document.body.appendChild(overlay);
      document.body.style.overflow = "hidden";

      overlay.querySelector(".welcome-btn").addEventListener("click", () => {
        audio.play().catch(() => {});
        sessionStorage.setItem(K_STATE, "on");
        overlay.classList.add("hide");
        document.body.style.overflow = "";
        setTimeout(() => overlay.remove(), 600);
      });
    }
  };

  if (document.body) init();
  else document.addEventListener("DOMContentLoaded", init);
})();
