import React, { useEffect, useRef } from "react";

interface CalculatorPanelProps {
  isVisible: boolean;
  angleMode: "DEG" | "RAD";
  toggleAngle: () => void;
  isSciMode: boolean;
  setIsSciMode: (v: boolean) => void;
  memory: number;
  prevExpr: string;
  expr: string;
  result: string;
  popState: boolean;
  onInsert: (s: string) => void;
  onDel: () => void;
  onClear: () => void;
  onEquals: () => void;
  onMemOp: (op: "mc" | "mr" | "m+" | "m-") => void;
}

export function CalculatorPanel({
  isVisible,
  angleMode,
  toggleAngle,
  isSciMode,
  setIsSciMode,
  memory,
  prevExpr,
  expr,
  result,
  popState,
  onInsert,
  onDel,
  onClear,
  onEquals,
  onMemOp,
}: CalculatorPanelProps) {
  const resultRef = useRef<HTMLDivElement>(null);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(result);
      // In a real app we'd trigger a toast here
    } catch {}
  };

  const ripple = (e: React.MouseEvent<HTMLButtonElement>) => {
    const el = e.currentTarget;
    const rect = el.getBoundingClientRect();
    const r = document.createElement("span");
    r.className = "ripple";
    const size = Math.max(rect.width, rect.height);
    r.style.width = r.style.height = size + "px";
    r.style.left = e.clientX - rect.left - size / 2 + "px";
    r.style.top = e.clientY - rect.top - size / 2 + "px";
    el.appendChild(r);
    setTimeout(() => r.remove(), 650);
  };

  const handleBtnClick = (e: React.MouseEvent<HTMLButtonElement>, action: () => void) => {
    ripple(e);
    action();
  };

  return (
    <section className={`panel ${isVisible ? "" : "hidden"}`} id="panel-calc">
      <div className="display glass">
        <div className="display-meta">
          <span className="chip">{angleMode}</span>
          <span className="chip toggle" title="Scientific mode">
            <label className="switch">
              <input
                type="checkbox"
                checked={isSciMode}
                onChange={(e) => setIsSciMode(e.target.checked)}
              />
              <span></span>
            </label>
            Scientific
          </span>
          <span className="grow"></span>
          <span className="mem-chip">
            M: {Number.isFinite(memory) ? parseFloat(memory.toPrecision(12)).toString() : memory}
          </span>
        </div>
        <div className="prev">{prevExpr}</div>
        <div className="expr">{expr || "0"}</div>
        <div className="result-row">
          <div ref={resultRef} className={`result ${popState ? "pop" : ""}`}>
            {result}
          </div>
          <button className="icon-btn small" onClick={handleCopy} title="Copy">
            ⧉
          </button>
        </div>
      </div>

      <div className={`keypad-wrap ${isSciMode ? "" : "basic"}`}>
        <div className="keypad sci">
          <button onClick={(e) => handleBtnClick(e, () => onInsert("sin("))}>sin</button>
          <button onClick={(e) => handleBtnClick(e, () => onInsert("cos("))}>cos</button>
          <button onClick={(e) => handleBtnClick(e, () => onInsert("tan("))}>tan</button>
          <button onClick={(e) => handleBtnClick(e, () => onInsert("asin("))}>asin</button>
          <button onClick={(e) => handleBtnClick(e, () => onInsert("acos("))}>acos</button>
          <button onClick={(e) => handleBtnClick(e, () => onInsert("atan("))}>atan</button>
          <button onClick={(e) => handleBtnClick(e, () => onInsert("log("))}>log</button>
          <button onClick={(e) => handleBtnClick(e, () => onInsert("ln("))}>ln</button>
          <button onClick={(e) => handleBtnClick(e, () => onInsert("sqrt("))}>√</button>
          <button onClick={(e) => handleBtnClick(e, () => onInsert("cbrt("))}>∛</button>
          <button onClick={(e) => handleBtnClick(e, () => onInsert("^2"))}>x²</button>
          <button onClick={(e) => handleBtnClick(e, () => onInsert("^3"))}>x³</button>
          <button onClick={(e) => handleBtnClick(e, () => onInsert("^"))}>xʸ</button>
          <button onClick={(e) => handleBtnClick(e, () => onInsert("!"))}>x!</button>
          <button onClick={(e) => handleBtnClick(e, () => onInsert("abs("))}>|x|</button>
          <button onClick={(e) => handleBtnClick(e, () => onInsert("exp("))}>eˣ</button>
          <button onClick={(e) => handleBtnClick(e, () => onInsert("pi"))}>π</button>
          <button onClick={(e) => handleBtnClick(e, () => onInsert("e"))}>e</button>
          <button onClick={(e) => handleBtnClick(e, () => onInsert("random("))}>rnd</button>
          <button onClick={(e) => handleBtnClick(e, toggleAngle)}>DEG/RAD</button>
        </div>

        <div className="keypad mem">
          <button onClick={(e) => handleBtnClick(e, () => onMemOp("mc"))}>MC</button>
          <button onClick={(e) => handleBtnClick(e, () => onMemOp("mr"))}>MR</button>
          <button onClick={(e) => handleBtnClick(e, () => onMemOp("m+"))}>M+</button>
          <button onClick={(e) => handleBtnClick(e, () => onMemOp("m-"))}>M-</button>
        </div>

        <div className="keypad main-pad">
          <button className="util" onClick={(e) => handleBtnClick(e, onClear)}>
            AC
          </button>
          <button className="util" onClick={(e) => handleBtnClick(e, onDel)}>
            ⌫
          </button>
          <button className="util" onClick={(e) => handleBtnClick(e, () => onInsert("("))}>
            (
          </button>
          <button className="util" onClick={(e) => handleBtnClick(e, () => onInsert(")"))}>
            )
          </button>

          <button onClick={(e) => handleBtnClick(e, () => onInsert("7"))}>7</button>
          <button onClick={(e) => handleBtnClick(e, () => onInsert("8"))}>8</button>
          <button onClick={(e) => handleBtnClick(e, () => onInsert("9"))}>9</button>
          <button className="op" onClick={(e) => handleBtnClick(e, () => onInsert("/"))}>
            ÷
          </button>

          <button onClick={(e) => handleBtnClick(e, () => onInsert("4"))}>4</button>
          <button onClick={(e) => handleBtnClick(e, () => onInsert("5"))}>5</button>
          <button onClick={(e) => handleBtnClick(e, () => onInsert("6"))}>6</button>
          <button className="op" onClick={(e) => handleBtnClick(e, () => onInsert("*"))}>
            ×
          </button>

          <button onClick={(e) => handleBtnClick(e, () => onInsert("1"))}>1</button>
          <button onClick={(e) => handleBtnClick(e, () => onInsert("2"))}>2</button>
          <button onClick={(e) => handleBtnClick(e, () => onInsert("3"))}>3</button>
          <button className="op" onClick={(e) => handleBtnClick(e, () => onInsert("-"))}>
            −
          </button>

          <button onClick={(e) => handleBtnClick(e, () => onInsert("0"))}>0</button>
          <button onClick={(e) => handleBtnClick(e, () => onInsert("."))}>.</button>
          <button onClick={(e) => handleBtnClick(e, () => onInsert("%"))}>%</button>
          <button className="op" onClick={(e) => handleBtnClick(e, () => onInsert("+"))}>
            +
          </button>

          <button
            className="equals"
            style={{ gridColumn: "span 4" }}
            onClick={(e) => handleBtnClick(e, onEquals)}
          >
            =
          </button>
        </div>
      </div>
    </section>
  );
}
