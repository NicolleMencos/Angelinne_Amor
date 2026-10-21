document.addEventListener("DOMContentLoaded", () => {
  // Decoración: estrellas flotantes.
  const stars = document.querySelector(".stars");

  if (stars) {
    for (let i = 0; i < 18; i++) {
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

  // Evita que los enlaces internos provoquen errores si cambia la estructura.
  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener("click", (event) => {
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
  });
});

// ===== Música de fondo =====
(() => {
  const MUSIC_SRC = "musica/cancion.mp3"; // cambia el nombre si tu archivo se llama distinto
  const VOLUME = 0.6;
  const K_STATE = "musica-estado"; // "on" | "off"
  const K_TIME = "musica-tiempo";
  const K_STAMP = "musica-stamp";

  const audio = new Audio(MUSIC_SRC);
  audio.loop = true;
  audio.volume = VOLUME;
  audio.preload = "auto";

  // --- Calcular desde dónde retomar ---
  let resumeAt = parseFloat(sessionStorage.getItem(K_TIME)) || 0;
  const stamp = parseFloat(sessionStorage.getItem(K_STAMP)) || 0;
  if (resumeAt && stamp && sessionStorage.getItem(K_STATE) === "on") {
    resumeAt += (Date.now() - stamp) / 1000; // tiempo que tardó en cargar la página
  }

  let seeked = false;
  const applySeek = () => {
    if (seeked || !resumeAt || !isFinite(audio.duration) || audio.duration <= 0) return;
    audio.currentTime = resumeAt % audio.duration;
    seeked = true;
  };
  audio.addEventListener("loadedmetadata", applySeek);
  audio.addEventListener("canplay", applySeek);
  audio.addEventListener("playing", applySeek); // clave en iPhone

  // --- Guardar posición de forma fiable ---
  const saveTime = () => {
    if (!seeked && resumeAt) return; // no pisar el valor antes de haber retomado
    sessionStorage.setItem(K_TIME, audio.currentTime);
    sessionStorage.setItem(K_STAMP, Date.now());
  };
  audio.addEventListener("timeupdate", saveTime);
  window.addEventListener("pagehide", saveTime);
  document.addEventListener("visibilitychange", saveTime);
  document.addEventListener("click", (e) => {
    if (e.target.closest("a[href]")) saveTime(); // justo antes de cambiar de página
  }, true);

  // --- Botón flotante ---
  const btn = document.createElement("button");
  btn.className = "music-btn";
  btn.type = "button";
  btn.setAttribute("aria-label", "Pausar o reproducir música");
  const refreshBtn = () =>
    (btn.textContent = audio.paused ? "▶ REPRODUCIR MÚSICA" : "⏸ PAUSAR MÚSICA");

  btn.addEventListener("click", () => {
    if (audio.paused) {
      audio.play().catch(() => {});
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
        // El móvil bloquea el autoplay: arranca con el primer toque
        const resume = () => {
          audio.play().catch(() => {});
          ["pointerdown", "touchend", "click"].forEach((ev) =>
            window.removeEventListener(ev, resume)
          );
        };
        ["pointerdown", "touchend", "click"].forEach((ev) =>
          window.addEventListener(ev, resume)
        );
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
  };

  if (document.body) init();
  else document.addEventListener("DOMContentLoaded", init);
})();
