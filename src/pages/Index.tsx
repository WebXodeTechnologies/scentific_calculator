import React, { useState } from "react";

import { useSettings } from "../hooks/useSettings";
import { useHistory } from "../hooks/useHistory";
import { useCalculator } from "../hooks/useCalculator";

import { Topbar } from "../components/Topbar";
import { Sidebar } from "../components/Sidebar";
import { CalculatorPanel } from "../components/CalculatorPanel";
import { GraphPanel } from "../components/GraphPanel";
import { ConverterPanel } from "../components/ConverterPanel";
import { SettingsModal } from "../components/SettingsModal";
import { Particles } from "../components/Particles";

export default function Index() {
  const [mode, setMode] = useState<"calc" | "graph" | "convert">("calc");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const {
    theme,
    setTheme,
    soundsOn,
    setSounds,
    animSpeed,
    setSpeed,
    clearStorage,
  } = useSettings();

  const {
    items: historyItems,
    filter,
    setFilter,
    add: addHistory,
    remove: removeHistory,
    clear: clearHistory,
    exportCsv,
    exportPdf,
  } = useHistory();

  const {
    expr,
    result,
    prevExpr,
    memory,
    angleMode,
    isSciMode,
    popState,
    insert,
    del,
    clear,
    equals,
    toggleAngle,
    setAngleMode,
    setIsSciMode,
    memOp,
    setExpr,
  } = useCalculator(soundsOn, (e, r) => addHistory(e, r));

  return (
    <>
      <div className="bg-aurora"></div>
      <Particles />

      <div className="app">
        <Sidebar
          isOpen={isSidebarOpen}
          historyItems={historyItems}
          filter={filter}
          setFilter={setFilter}
          onClear={clearHistory}
          onRemoveItem={removeHistory}
          onSelectExpr={(e) => setExpr(e)}
          onExportCsv={exportCsv}
          onExportPdf={exportPdf}
        />

        <main className="main">
          <Topbar
            mode={mode}
            setMode={setMode}
            onToggleSidebar={() => setIsSidebarOpen((v) => !v)}
            onSettings={() => setIsSettingsOpen(true)}
            onThemeBtn={() => {
              const themes = ["cyber", "glass", "light", "matrix"];
              const i = (themes.indexOf(theme) + 1) % themes.length;
              setTheme(themes[i]);
            }}
          />

          <CalculatorPanel
            isVisible={mode === "calc"}
            angleMode={angleMode}
            toggleAngle={toggleAngle}
            isSciMode={isSciMode}
            setIsSciMode={setIsSciMode}
            memory={memory}
            prevExpr={prevExpr}
            expr={expr}
            result={result}
            popState={popState}
            onInsert={insert}
            onDel={del}
            onClear={clear}
            onEquals={equals}
            onMemOp={memOp}
          />

          <GraphPanel isVisible={mode === "graph"} angleMode={angleMode} />

          <ConverterPanel isVisible={mode === "convert"} />
        </main>
      </div>

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        theme={theme}
        setTheme={setTheme}
        soundsOn={soundsOn}
        setSounds={setSounds}
        angleMode={angleMode}
        setAngleMode={setAngleMode}
        animSpeed={animSpeed}
        setSpeed={setSpeed}
        onClearStorage={clearStorage}
      />
    </>
  );
}
