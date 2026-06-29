import React from "react";
import { HistoryItem } from "../hooks/useHistory";

interface SidebarProps {
  isOpen: boolean;
  historyItems: HistoryItem[];
  filter: string;
  setFilter: (f: string) => void;
  onClear: () => void;
  onRemoveItem: (id: number) => void;
  onSelectExpr: (expr: string) => void;
  onExportCsv: () => void;
  onExportPdf: () => void;
}

export function Sidebar({
  isOpen,
  historyItems,
  filter,
  setFilter,
  onClear,
  onRemoveItem,
  onSelectExpr,
  onExportCsv,
  onExportPdf,
}: SidebarProps) {
  return (
    <aside className={`sidebar glass ${isOpen ? "open" : ""}`} id="sidebar">
      <div className="sidebar-head">
        <h2>History</h2>
        <div className="row">
          <input
            id="historySearch"
            type="text"
            placeholder="Search…"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
          <button className="icon-btn" onClick={onClear} title="Clear all">
            🗑
          </button>
        </div>
      </div>
      <ul className="history-list">
        {historyItems.length === 0 ? (
          <li className="empty-state" style={{ textAlign: "center", opacity: 0.5, padding: "1rem" }}>
            No calculations yet
          </li>
        ) : (
          historyItems.map((it) => (
            <li
              key={it.id}
              onClick={(e) => {
                if ((e.target as HTMLElement).classList.contains("h-del")) {
                  onRemoveItem(it.id);
                } else {
                  onSelectExpr(it.expression);
                }
              }}
            >
              <div>
                <div className="h-expr">{it.expression}</div>
                <div className="h-res">= {it.result}</div>
              </div>
              <button className="h-del" title="Delete">
                ✕
              </button>
            </li>
          ))
        )}
      </ul>
      <div className="sidebar-foot">
        <button className="ghost-btn" onClick={onExportCsv}>
          Export CSV
        </button>
        <button className="ghost-btn" onClick={onExportPdf}>
          Export PDF
        </button>
      </div>
    </aside>
  );
}
