import { useState, useEffect, useCallback } from "react";
import { useAppStore } from "../lib/store";
import { evaluate } from "../lib/parser";

export function useCalculator(
  soundsOn: boolean,
  onEquals?: (expr: string, result: string) => void
) {
  const expr = useAppStore((state) => state.lastExpr);
  const setExprState = useAppStore((state) => state.setLastExpr);
  const memory = useAppStore((state) => state.memory);
  const setMemory = useAppStore((state) => state.setMemory);
  const angleMode = useAppStore((state) => state.angle);
  const setAngleModeState = useAppStore((state) => state.setAngle);
  const isSciMode = useAppStore((state) => state.sci);
  const setIsSciModeState = useAppStore((state) => state.setSci);

  const [prevExpr, setPrevExpr] = useState<string>("");
  const [result, setResult] = useState<string>("0");
  const [popState, setPopState] = useState(false);

  // Audio Context
  let actx: AudioContext | undefined;
  const ping = useCallback(
    (freq = 520) => {
      if (!soundsOn) return;
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (!actx) actx = new AudioCtx();
        const o = actx.createOscillator();
        const g = actx.createGain();
        o.frequency.value = freq;
        o.type = "sine";
        g.gain.value = 0.04;
        o.connect(g).connect(actx.destination);
        o.start();
        g.gain.exponentialRampToValueAtTime(0.0001, actx.currentTime + 0.12);
        o.stop(actx.currentTime + 0.13);
      } catch {}
    },
    [soundsOn]
  );

  const format = (v: number) => {
    if (!Number.isFinite(v)) return v.toString();
    const abs = Math.abs(v);
    if (abs !== 0 && (abs >= 1e12 || abs < 1e-6)) return v.toExponential(6);
    return parseFloat(v.toPrecision(12)).toString();
  };

  const renderResult = useCallback(
    (currentExpr: string) => {
      try {
        if (currentExpr) {
          const v = evaluate(currentExpr, {}, angleMode);
          setResult(format(v));
        } else {
          setResult("0");
        }
      } catch {
        setResult("…");
      }
    },
    [angleMode]
  );

  useEffect(() => {
    renderResult(expr);
  }, [expr, renderResult]);

  const insert = (s: string) => {
    setExprState(expr + s);
    ping();
  };

  const del = () => {
    setExprState(expr.slice(0, -1));
  };

  const clear = () => {
    setExprState("");
    setPrevExpr("");
  };

  const equals = () => {
    if (!expr) return;
    try {
      const v = evaluate(expr, {}, angleMode);
      const out = format(v);
      setPrevExpr(expr + " =");
      if (onEquals) onEquals(expr, out);
      setExprState(out);
      setPopState(true);
      setTimeout(() => setPopState(false), 250);
      ping(880);
    } catch (e: any) {
      ping(220);
      // In a real app we might use toast here
    }
  };

  const toggleAngle = () => {
    const newAngle = angleMode === "DEG" ? "RAD" : "DEG";
    setAngleModeState(newAngle);
  };

  const setAngleMode = (newAngle: "DEG" | "RAD") => {
    setAngleModeState(newAngle);
  };

  const setIsSciMode = (v: boolean) => {
    setIsSciModeState(v);
  };

  const memOp = (op: "mc" | "mr" | "m+" | "m-") => {
    let v = 0;
    try {
      v = expr ? evaluate(expr, {}, angleMode) : parseFloat(result) || 0;
    } catch {}

    let newMemory = memory;
    if (op === "mc") newMemory = 0;
    else if (op === "mr") {
      insert(String(memory));
      return;
    } else if (op === "m+") newMemory += v;
    else if (op === "m-") newMemory -= v;

    setMemory(newMemory);
  };

  const setExpr = (s: string) => {
    setExprState(s);
  };

  return {
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
  };
}
