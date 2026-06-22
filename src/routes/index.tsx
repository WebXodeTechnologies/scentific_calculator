import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
// Load the standalone vanilla files as raw strings (bundled at build time).
import calcCss from "../../public/calcx-pro/css/style.css?raw";
import calcJs from "../../public/calcx-pro/js/script.js?raw";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CalcX Pro — Precision Meets Innovation" },
      {
        name: "description",
        content:
          "Premium scientific calculator with graphing, unit conversion, history, and a glassmorphism UI.",
      },
      { property: "og:title", content: "CalcX Pro — Precision Meets Innovation" },
      {
        property: "og:description",
        content:
          "Advanced scientific calculator: graphing, unit conversion, history, exports, and 4 themes.",
      },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&family=Space+Grotesk:wght@400;500;600;700&display=swap",
      },
    ],
  }),
  component: Index,
});

const BODY_HTML = `
  <div class="bg-aurora"></div>
  <canvas id="particles" class="particles"></canvas>
  <div id="toast" class="toast" role="status" aria-live="polite"></div>

  <div class="app">
    <aside class="sidebar glass" id="sidebar">
      <div class="sidebar-head">
        <h2>History</h2>
        <div class="row">
          <input id="historySearch" type="text" placeholder="Search…" />
          <button class="icon-btn" id="clearHistory" title="Clear all">🗑</button>
        </div>
      </div>
      <ul id="historyList" class="history-list"></ul>
      <div class="sidebar-foot">
        <button class="ghost-btn" id="exportCsv">Export CSV</button>
        <button class="ghost-btn" id="exportPdf">Export PDF</button>
      </div>
    </aside>

    <main class="main">
      <header class="topbar glass">
        <div class="brand">
          <div class="logo">∑</div>
          <div>
            <h1>CalcX <span>Pro</span></h1>
            <p class="tag">Precision Meets Innovation</p>
          </div>
        </div>
        <nav class="modes" role="tablist">
          <button class="mode-btn active" data-mode="calc" role="tab">Calculator</button>
          <button class="mode-btn" data-mode="graph" role="tab">Graph</button>
          <button class="mode-btn" data-mode="convert" role="tab">Converter</button>
        </nav>
        <div class="actions">
          <button class="icon-btn" id="toggleSidebar" title="History">🕘</button>
          <button class="icon-btn" id="themeBtn" title="Theme">🎨</button>
          <button class="icon-btn" id="settingsBtn" title="Settings">⚙</button>
          <button class="icon-btn" id="fullscreenBtn" title="Fullscreen">⛶</button>
        </div>
      </header>

      <section class="panel" id="panel-calc">
        <div class="display glass">
          <div class="display-meta">
            <span id="angleMode" class="chip">DEG</span>
            <span id="sciToggleWrap" class="chip toggle" title="Scientific mode">
              <label class="switch"><input type="checkbox" id="sciToggle" checked /><span></span></label>
              Scientific
            </span>
            <span class="grow"></span>
            <span class="mem-chip" id="memChip">M: 0</span>
          </div>
          <div class="prev" id="prevExpr"></div>
          <div class="expr" id="expr">0</div>
          <div class="result-row">
            <div class="result" id="result">0</div>
            <button class="icon-btn small" id="copyResult" title="Copy">⧉</button>
          </div>
        </div>

        <div class="keypad-wrap">
          <div class="keypad sci" id="sciPad">
            <button data-fn="sin(">sin</button>
            <button data-fn="cos(">cos</button>
            <button data-fn="tan(">tan</button>
            <button data-fn="asin(">asin</button>
            <button data-fn="acos(">acos</button>
            <button data-fn="atan(">atan</button>
            <button data-fn="log(">log</button>
            <button data-fn="ln(">ln</button>
            <button data-fn="sqrt(">√</button>
            <button data-fn="cbrt(">∛</button>
            <button data-insert="^2">x²</button>
            <button data-insert="^3">x³</button>
            <button data-insert="^">xʸ</button>
            <button data-insert="!">x!</button>
            <button data-fn="abs(">|x|</button>
            <button data-fn="exp(">eˣ</button>
            <button data-insert="pi">π</button>
            <button data-insert="e">e</button>
            <button data-fn="random(">rnd</button>
            <button data-action="angle">DEG/RAD</button>
          </div>

          <div class="keypad mem">
            <button data-action="mc">MC</button>
            <button data-action="mr">MR</button>
            <button data-action="m+">M+</button>
            <button data-action="m-">M-</button>
          </div>

          <div class="keypad main-pad">
            <button class="util" data-action="clear">AC</button>
            <button class="util" data-action="del">⌫</button>
            <button class="util" data-insert="(">(</button>
            <button class="util" data-insert=")">)</button>

            <button data-insert="7">7</button>
            <button data-insert="8">8</button>
            <button data-insert="9">9</button>
            <button class="op" data-insert="/">÷</button>

            <button data-insert="4">4</button>
            <button data-insert="5">5</button>
            <button data-insert="6">6</button>
            <button class="op" data-insert="*">×</button>

            <button data-insert="1">1</button>
            <button data-insert="2">2</button>
            <button data-insert="3">3</button>
            <button class="op" data-insert="-">−</button>

            <button data-insert="0">0</button>
            <button data-insert=".">.</button>
            <button data-insert="%">%</button>
            <button class="op" data-insert="+">+</button>

            <button class="equals" data-action="equals" style="grid-column: span 4;">=</button>
          </div>
        </div>
      </section>

      <section class="panel hidden" id="panel-graph">
        <div class="glass graph-card">
          <div class="graph-controls">
            <input id="fnInput" type="text" placeholder="e.g. sin(x) + x/4" />
            <button class="primary" id="plotBtn">Plot</button>
            <button class="ghost-btn" id="addFn">+ Add</button>
            <button class="ghost-btn" id="zoomIn">＋</button>
            <button class="ghost-btn" id="zoomOut">−</button>
            <button class="ghost-btn" id="resetGraph">Reset</button>
          </div>
          <div class="fn-chips" id="fnChips"></div>
          <canvas id="graphCanvas"></canvas>
        </div>
      </section>

      <section class="panel hidden" id="panel-convert">
        <div class="glass convert-card">
          <div class="convert-tabs">
            <button class="conv-tab active" data-cat="length">Length</button>
            <button class="conv-tab" data-cat="weight">Weight</button>
            <button class="conv-tab" data-cat="temperature">Temperature</button>
          </div>
          <div class="convert-grid">
            <div>
              <label>From</label>
              <input type="number" id="convFromVal" value="1" />
              <select id="convFromUnit"></select>
            </div>
            <div class="eq">⇄</div>
            <div>
              <label>To</label>
              <input type="number" id="convToVal" readonly />
              <select id="convToUnit"></select>
            </div>
          </div>
        </div>
      </section>
    </main>
  </div>

  <div class="modal" id="settingsModal" aria-hidden="true">
    <div class="modal-card glass">
      <header><h3>Settings</h3><button class="icon-btn" data-close-modal>✕</button></header>
      <div class="setting"><label>Theme</label>
        <div class="theme-grid">
          <button class="theme-swatch" data-theme="cyber" title="Cyber Neon"></button>
          <button class="theme-swatch" data-theme="glass" title="Glass Dark"></button>
          <button class="theme-swatch" data-theme="light" title="Minimal Light"></button>
          <button class="theme-swatch" data-theme="matrix" title="Matrix Green"></button>
        </div>
      </div>
      <div class="setting"><label>Sounds</label>
        <label class="switch"><input type="checkbox" id="soundToggle" /><span></span></label>
      </div>
      <div class="setting"><label>Angle Mode</label>
        <select id="angleSelect"><option value="DEG">Degrees</option><option value="RAD">Radians</option></select>
      </div>
      <div class="setting"><label>Animation Speed</label>
        <input type="range" id="animSpeed" min="0" max="2" step="0.1" value="1" />
      </div>
      <div class="setting">
        <button class="danger" id="clearStorage">Clear Local Storage</button>
      </div>
    </div>
  </div>
`;

function Index() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Set the theme attribute on <html> (the vanilla CSS targets html[data-theme]).
    const prevTheme = document.documentElement.getAttribute("data-theme");
    document.documentElement.setAttribute("data-theme", prevTheme || "cyber");
    document.body.style.overflow = "hidden";

    // Inject the stylesheet once.
    const styleId = "calcx-pro-style";
    let styleEl = document.getElementById(styleId) as HTMLStyleElement | null;
    if (!styleEl) {
      styleEl = document.createElement("style");
      styleEl.id = styleId;
      styleEl.textContent = calcCss;
      document.head.appendChild(styleEl);
    }

    // Run the calculator script in module scope, scoped to this mount.
    // We wrap it in an IIFE and re-execute on mount so reloads work.
    const scriptEl = document.createElement("script");
    scriptEl.textContent = `(function(){\n${calcJs}\n})();`;
    document.body.appendChild(scriptEl);

    return () => {
      scriptEl.remove();
      document.body.style.overflow = "";
    };
  }, []);

  return <div ref={mountRef} dangerouslySetInnerHTML={{ __html: BODY_HTML }} />;
}
