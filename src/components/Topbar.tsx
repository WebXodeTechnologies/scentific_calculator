import React from "react";

interface TopbarProps {
  mode: "calc" | "graph" | "convert";
  setMode: (mode: "calc" | "graph" | "convert") => void;
  onToggleSidebar: () => void;
  onSettings: () => void;
  onThemeBtn: () => void;
}

export function Topbar({ mode, setMode, onToggleSidebar, onSettings, onThemeBtn }: TopbarProps) {
  const handleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  };

  return (
    <header className="topbar glass">
      <div className="brand">
        <div className="logo">∑</div>
        <div>
          <h1>
            CalcX <span>Pro</span>
          </h1>
          <p className="tag">Precision Meets Innovation</p>
        </div>
      </div>
      <nav className="modes" role="tablist">
        <button
          className={`mode-btn ${mode === "calc" ? "active" : ""}`}
          onClick={() => setMode("calc")}
          role="tab"
        >
          Calculator
        </button>
        <button
          className={`mode-btn ${mode === "graph" ? "active" : ""}`}
          onClick={() => setMode("graph")}
          role="tab"
        >
          Graph
        </button>
        <button
          className={`mode-btn ${mode === "convert" ? "active" : ""}`}
          onClick={() => setMode("convert")}
          role="tab"
        >
          Converter
        </button>
      </nav>
      <div className="actions">
        <button className="icon-btn" onClick={onToggleSidebar} title="History">
          🕘
        </button>
        <button className="icon-btn" onClick={onThemeBtn} title="Theme">
          🎨
        </button>
        <button className="icon-btn" onClick={onSettings} title="Settings">
          ⚙
        </button>
        <button className="icon-btn" onClick={handleFullscreen} title="Fullscreen">
          ⛶
        </button>
      </div>
    </header>
  );
}
