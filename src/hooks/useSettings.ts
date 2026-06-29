import { useEffect } from "react";
import { useAppStore } from "../lib/store";

export function useSettings() {
  const theme = useAppStore((state) => state.theme);
  const setThemeState = useAppStore((state) => state.setTheme);
  const soundsOn = useAppStore((state) => state.soundsOn);
  const setSoundsOn = useAppStore((state) => state.setSounds);
  const animSpeed = useAppStore((state) => state.animSpeed);
  const setAnimSpeed = useAppStore((state) => state.setSpeed);

  const setTheme = (t: string) => {
    document.documentElement.setAttribute("data-theme", t);
    setThemeState(t);
  };

  const setSounds = (v: boolean) => {
    setSoundsOn(v);
  };

  const setSpeed = (v: number) => {
    document.documentElement.style.setProperty("--speed", v.toString());
    setAnimSpeed(v);
  };

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    document.documentElement.style.setProperty("--speed", animSpeed.toString());
  }, [theme, animSpeed]);

  const clearStorage = () => {
    if (confirm("Clear all CalcX Pro data?")) {
      localStorage.clear();
      window.location.reload();
    }
  };

  return {
    theme,
    setTheme,
    soundsOn,
    setSounds,
    animSpeed,
    setSpeed,
    clearStorage,
  };
}
