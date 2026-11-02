(() => {
  "use strict";

  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Fade sections in as they scroll into view
  const faders = document.querySelectorAll(".fade-in");
  if ("IntersectionObserver" in window && !still) {
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          e.target.classList.add("shown");
          io.unobserve(e.target);
        }
      }
    }, { threshold: 0.12 });
    faders.forEach((el) => io.observe(el));
  } else {
    faders.forEach((el) => el.classList.add("shown"));
  }

  // Hero background: layered near-surface model with a dispersive surface-wave train
  const canvas = document.getElementById("fieldCanvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  let w = 0, h = 0;

  const layers = [0.58, 0.70, 0.84]; // interface depths (fraction of height)

  function fit() {
    const r = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = Math.max(1, Math.floor(r.width));
    h = Math.max(1, Math.floor(r.height));
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    render(0);
  }

  function backdrop() {
    const g = ctx.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, "#0f2740");
    g.addColorStop(0.55, "#0c5560");
    g.addColorStop(1, "#112a44");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  }

  function strata(t) {
    ctx.save();
    layers.forEach((d, i) => {
      ctx.strokeStyle = `rgba(255, 226, 184, ${0.10 + i * 0.03})`;
      ctx.lineWidth = 1.2;
      ctx.setLineDash([10, 8]);
      ctx.beginPath();
      for (let x = 0; x <= w; x += 10) {
        const y = h * d + Math.sin(x * 0.004 + i * 1.7) * 10 + Math.sin(t * 0.0004 + x * 0.01) * 1.5;
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();
    });
    ctx.restore();
  }

  // A wave packet whose short wavelengths travel slower than long ones (dispersion)
  function packet(t, baseY, amp, color, lw, phase) {
    const span = w * 1.4;
    const center = ((t * 0.05 + phase) % span) - w * 0.2;
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = lw;
    ctx.beginPath();
    for (let x = 0; x <= w; x += 4) {
      const dx = x - center;
      const env = Math.exp(-(dx * dx) / (2 * Math.pow(w * 0.16, 2)));
      const k = 0.018 + 0.00002 * Math.max(0, -dx) * 1.2; // shorter wavelengths trail behind
      const y = baseY + Math.sin(dx * k - t * 0.004) * amp * env
              + Math.sin(x * 0.006 + t * 0.0006) * 3;
      x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
  }

  function receivers(t) {
    const n = w < 720 ? 9 : 16;
    const y0 = h * 0.5;
    ctx.save();
    for (let i = 0; i < n; i++) {
      const x = (w / (n + 1)) * (i + 1);
      const p = still ? 0.4 : 0.4 + 0.3 * Math.sin(t * 0.003 - i * 0.5);
      ctx.fillStyle = `rgba(255, 255, 255, ${0.5 + p * 0.3})`;
      ctx.beginPath();
      ctx.moveTo(x, y0 - 7);
      ctx.lineTo(x - 5, y0 + 2);
      ctx.lineTo(x + 5, y0 + 2);
      ctx.closePath();
      ctx.fill();
    }
    ctx.strokeStyle = "rgba(255, 255, 255, 0.18)";
    ctx.beginPath();
    ctx.moveTo(0, y0 + 2);
    ctx.lineTo(w, y0 + 2);
    ctx.stroke();
    ctx.restore();
  }

  function render(t) {
    ctx.clearRect(0, 0, w, h);
    backdrop();
    strata(t);
    receivers(t);
    packet(t, h * 0.5, 26, "rgba(168, 230, 223, 0.7)", 2.4, 0);
    packet(t, h * 0.64, 16, "rgba(255, 196, 128, 0.55)", 1.6, w * 0.5);
    packet(t, h * 0.77, 10, "rgba(190, 210, 240, 0.45)", 1.4, w * 0.9);
  }

  function loop(t) {
    render(t);
    requestAnimationFrame(loop);
  }

  window.addEventListener("resize", fit, { passive: true });
  fit();
  if (!still) requestAnimationFrame(loop);
})();
