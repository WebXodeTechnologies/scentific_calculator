import React, { useState, useEffect } from "react";

interface ConverterPanelProps {
  isVisible: boolean;
}

const UNITS: Record<string, Record<string, number | string>> = {
  length: { Meter: 1, Kilometer: 1000, Mile: 1609.344, Foot: 0.3048 },
  weight: { Gram: 1, Kilogram: 1000, Pound: 453.59237 },
  temperature: { Celsius: "C", Fahrenheit: "F", Kelvin: "K" },
};

export function ConverterPanel({ isVisible }: ConverterPanelProps) {
  const [cat, setCat] = useState<"length" | "weight" | "temperature">("length");
  const [fromVal, setFromVal] = useState<string>("1");
  const [toVal, setToVal] = useState<string>("");
  const [fromUnit, setFromUnit] = useState<string>("Meter");
  const [toUnit, setToUnit] = useState<string>("Kilometer");

  const formatNum = (n: number) => parseFloat(n.toPrecision(8)).toString();

  const convertTemp = (v: number, from: string, to: string) => {
    let c;
    if (from === "Celsius") c = v;
    else if (from === "Fahrenheit") c = ((v - 32) * 5) / 9;
    else c = v - 273.15;

    if (to === "Celsius") return c;
    if (to === "Fahrenheit") return (c * 9) / 5 + 32;
    return c + 273.15;
  };

  useEffect(() => {
    const v = parseFloat(fromVal);
    if (!Number.isFinite(v)) {
      setToVal("");
      return;
    }

    if (cat === "temperature") {
      setToVal(formatNum(convertTemp(v, fromUnit, toUnit)));
    } else {
      const fromFactor = UNITS[cat][fromUnit] as number;
      const toFactor = UNITS[cat][toUnit] as number;
      if (fromFactor && toFactor) {
        setToVal(formatNum((v * fromFactor) / toFactor));
      }
    }
  }, [cat, fromVal, fromUnit, toUnit]);

  const handleTabClick = (newCat: "length" | "weight" | "temperature") => {
    setCat(newCat);
    const u = Object.keys(UNITS[newCat]);
    setFromUnit(u[0]);
    setToUnit(u[1] || u[0]);
  };

  const currentUnits = Object.keys(UNITS[cat]);

  return (
    <section className={`panel ${isVisible ? "" : "hidden"}`} id="panel-convert">
      <div className="glass convert-card">
        <div className="convert-tabs">
          <button
            className={`conv-tab ${cat === "length" ? "active" : ""}`}
            onClick={() => handleTabClick("length")}
          >
            Length
          </button>
          <button
            className={`conv-tab ${cat === "weight" ? "active" : ""}`}
            onClick={() => handleTabClick("weight")}
          >
            Weight
          </button>
          <button
            className={`conv-tab ${cat === "temperature" ? "active" : ""}`}
            onClick={() => handleTabClick("temperature")}
          >
            Temperature
          </button>
        </div>
        <div className="convert-grid">
          <div>
            <label>From</label>
            <input
              type="number"
              value={fromVal}
              onChange={(e) => setFromVal(e.target.value)}
            />
            <select
              value={fromUnit}
              onChange={(e) => setFromUnit(e.target.value)}
            >
              {currentUnits.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </div>
          <div className="eq">⇄</div>
          <div>
            <label>To</label>
            <input type="number" value={toVal} readOnly />
            <select
              value={toUnit}
              onChange={(e) => setToUnit(e.target.value)}
            >
              {currentUnits.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </section>
  );
}
