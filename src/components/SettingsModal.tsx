import React from "react";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: string;
  setTheme: (t: string) => void;
  soundsOn: boolean;
  setSounds: (v: boolean) => void;
  angleMode: "DEG" | "RAD";
  setAngleMode: (m: "DEG" | "RAD") => void;
  animSpeed: number;
  setSpeed: (v: number) => void;
  onClearStorage: () => void;
}

export function SettingsModal({
  isOpen,
  onClose,
  theme,
  setTheme,
  soundsOn,
  setSounds,
  angleMode,
  setAngleMode,
  animSpeed,
  setSpeed,
  onClearStorage,
}: SettingsModalProps) {
  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="modal open" id="settingsModal" onClick={handleBackdropClick} aria-hidden={!isOpen}>
      <div className="modal-card glass">
        <header>
          <h3>Settings</h3>
          <button className="icon-btn" onClick={onClose}>
            ✕
          </button>
        </header>
        <div className="setting">
          <label>Theme</label>
          <div className="theme-grid">
            <button
              className={`theme-swatch ${theme === "cyber" ? "active" : ""}`}
              data-theme="cyber"
              title="Cyber Neon"
              onClick={() => setTheme("cyber")}
            ></button>
            <button
              className={`theme-swatch ${theme === "glass" ? "active" : ""}`}
              data-theme="glass"
              title="Glass Dark"
              onClick={() => setTheme("glass")}
            ></button>
            <button
              className={`theme-swatch ${theme === "light" ? "active" : ""}`}
              data-theme="light"
              title="Minimal Light"
              onClick={() => setTheme("light")}
            ></button>
            <button
              className={`theme-swatch ${theme === "matrix" ? "active" : ""}`}
              data-theme="matrix"
              title="Matrix Green"
              onClick={() => setTheme("matrix")}
            ></button>
          </div>
        </div>
        <div className="setting">
          <label>Sounds</label>
          <label className="switch">
            <input
              type="checkbox"
              checked={soundsOn}
              onChange={(e) => setSounds(e.target.checked)}
            />
            <span></span>
          </label>
        </div>
        <div className="setting">
          <label>Angle Mode</label>
          <select
            value={angleMode}
            onChange={(e) => setAngleMode(e.target.value as "DEG" | "RAD")}
          >
            <option value="DEG">Degrees</option>
            <option value="RAD">Radians</option>
          </select>
        </div>
        <div className="setting">
          <label>Animation Speed</label>
          <input
            type="range"
            min="0"
            max="2"
            step="0.1"
            value={animSpeed}
            onChange={(e) => setSpeed(parseFloat(e.target.value))}
          />
        </div>
        <div className="setting">
          <button className="danger" onClick={onClearStorage}>
            Clear Local Storage
          </button>
        </div>
      </div>
    </div>
  );
}
