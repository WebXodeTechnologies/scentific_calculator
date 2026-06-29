import React, { useEffect, useRef, useState, useCallback } from "react";
import { evaluate } from "../lib/parser";

interface GraphPanelProps {
  isVisible: boolean;
  angleMode: "DEG" | "RAD";
}

export function GraphPanel({ isVisible, angleMode }: GraphPanelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fns, setFns] = useState<string[]>(["sin(x)"]);
  const [inputVal, setInputVal] = useState("");
  const colors = ["#00e0ff", "#b14bff", "#ff3cac", "#4ade80", "#facc15"];

  const scaleRef = useRef(40); // px per unit
  const offXRef = useRef(0);
  const offYRef = useRef(0);
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0, ox: 0, oy: 0 });

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = canvas.width / window.devicePixelRatio;
    const H = canvas.height / window.devicePixelRatio;
    ctx.clearRect(0, 0, W, H);

    const cx = W / 2 + offXRef.current;
    const cy = H / 2 + offYRef.current;
    const scale = scaleRef.current;

    // grid
    ctx.strokeStyle = "rgba(255,255,255,0.06)";
    ctx.lineWidth = 1;
    for (let x = cx % scale; x < W; x += scale) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, H);
      ctx.stroke();
    }
    for (let y = cy % scale; y < H; y += scale) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }

    // axes
    ctx.strokeStyle = "rgba(255,255,255,0.3)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, cy);
    ctx.lineTo(W, cy);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(cx, 0);
    ctx.lineTo(cx, H);
    ctx.stroke();

    fns.forEach((expr, idx) => {
      ctx.strokeStyle = colors[idx % colors.length];
      ctx.lineWidth = 2;
      ctx.beginPath();
      let started = false;

      for (let px = 0; px < W; px += 1) {
        const x = (px - cx) / scale;
        let y;
        try {
          y = evaluate(expr, { x }, angleMode);
        } catch {
          started = false;
          continue;
        }
        if (!Number.isFinite(y)) {
          started = false;
          continue;
        }
        const py = cy - y * scale;
        if (!started) {
          ctx.moveTo(px, py);
          started = true;
        } else {
          ctx.lineTo(px, py);
        }
      }
      ctx.stroke();
    });
  }, [fns, angleMode]);

  const resize = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const r = canvas.getBoundingClientRect();
    canvas.width = r.width * window.devicePixelRatio;
    canvas.height = r.height * window.devicePixelRatio;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);
    }
    draw();
  }, [draw]);

  useEffect(() => {
    if (isVisible) {
      resize();
    }
  }, [isVisible, resize]);

  useEffect(() => {
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [resize]);

  const addFn = (expr: string) => {
    if (!expr) return;
    try {
      evaluate(expr, { x: 1 }, angleMode);
      setFns((prev) => [...prev, expr]);
      setInputVal("");
    } catch (e: any) {
      // Show toast error in real app
      console.error("Invalid function:", e.message);
    }
  };

  const removeFn = (idx: number) => {
    setFns((prev) => prev.filter((_, i) => i !== idx));
  };

  const reset = () => {
    setFns([]);
    scaleRef.current = 40;
    offXRef.current = 0;
    offYRef.current = 0;
    draw();
  };

  const zoom = (factor: number) => {
    scaleRef.current = Math.max(10, Math.min(300, scaleRef.current * factor));
    draw();
  };

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    isDragging.current = true;
    dragStart.current = {
      x: e.clientX,
      y: e.clientY,
      ox: offXRef.current,
      oy: offYRef.current,
    };
    canvas.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDragging.current) return;
    offXRef.current = dragStart.current.ox + e.clientX - dragStart.current.x;
    offYRef.current = dragStart.current.oy + e.clientY - dragStart.current.y;
    draw();
  };

  const onPointerUp = () => {
    isDragging.current = false;
  };

  const onWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    // e.preventDefault() isn't well supported in React synthetic wheel events.
    // Better to attach natively if we needed perfect preventDefault, 
    // but React wheel event gives us the delta.
    zoom(e.deltaY < 0 ? 1.1 : 0.9);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const preventDefaultWheel = (e: WheelEvent) => {
      e.preventDefault();
    };
    canvas.addEventListener("wheel", preventDefaultWheel, { passive: false });
    return () => canvas.removeEventListener("wheel", preventDefaultWheel);
  }, []);

  return (
    <section className={`panel ${isVisible ? "" : "hidden"}`} id="panel-graph">
      <div className="glass graph-card">
        <div className="graph-controls">
          <input
            id="fnInput"
            type="text"
            placeholder="e.g. sin(x) + x/4"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                setFns([]);
                addFn(inputVal);
              }
            }}
          />
          <button
            className="primary"
            onClick={() => {
              setFns([]);
              addFn(inputVal);
            }}
          >
            Plot
          </button>
          <button className="ghost-btn" onClick={() => addFn(inputVal)}>
            + Add
          </button>
          <button className="ghost-btn" onClick={() => zoom(1.25)}>
            ＋
          </button>
          <button className="ghost-btn" onClick={() => zoom(0.8)}>
            −
          </button>
          <button className="ghost-btn" onClick={reset}>
            Reset
          </button>
        </div>
        <div className="fn-chips" id="fnChips">
          {fns.map((f, i) => (
            <span key={i} className="fn-chip">
              <span
                className="swatch"
                style={{ background: colors[i % colors.length] }}
              ></span>
              y = {f}{" "}
              <button title="Remove" onClick={() => removeFn(i)}>
                ✕
              </button>
            </span>
          ))}
        </div>
        <canvas
          ref={canvasRef}
          id="graphCanvas"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onWheel={onWheel}
        ></canvas>
      </div>
    </section>
  );
}
