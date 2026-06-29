import { useState, useMemo } from "react";
import { useAppStore, HistoryItem } from "../lib/store";

export type { HistoryItem };

export function useHistory() {
  const items = useAppStore((state) => state.historyItems);
  const setItems = useAppStore((state) => state.setHistoryItems);
  const clearStoreHistory = useAppStore((state) => state.clearHistory);
  const [filter, setFilter] = useState("");

  const formatDate = (date: Date) => {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    let hours = date.getHours();
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12;
    hours = hours ? hours : 12;
    const min = String(date.getMinutes()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd} ${hours}:${min} ${ampm}`;
  };

  const add = (expression: string, result: string) => {
    if (!expression || !result || expression === result) return;
    setItems((prev) => {
      if (prev.length > 0 && prev[0].expression === expression && prev[0].result === result) {
        return prev;
      }
      const newItem: HistoryItem = {
        id: Date.now(),
        expression,
        result,
        timestamp: formatDate(new Date()),
      };
      const updated = [newItem, ...prev];
      if (updated.length > 200) updated.pop();
      return updated;
    });
  };

  const remove = (id: number) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const clear = () => {
    clearStoreHistory();
  };

  const filteredItems = useMemo(() => {
    const f = filter.toLowerCase();
    return items.filter((x) => !f || (x.expression + x.result).toLowerCase().includes(f));
  }, [items, filter]);

  const exportCsv = () => {
    const rows = [
      ["Timestamp", "Expression", "Result"],
      ...items.map((h) => [h.timestamp, h.expression, h.result]),
    ];
    const csv = rows
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    download("calcx-history.csv", csv, "text/csv");
  };

  const exportPdf = () => {
    const lines = items.slice(0, 60).map((h) => `${h.timestamp}  |  ${h.expression} = ${h.result}`);
    const text = ["CalcX Pro — History", ""].concat(lines).join("\n");
    const pdf = buildSimplePdf(text);
    download("calcx-history.pdf", pdf, "application/pdf");
  };

  function download(name: string, data: string | Blob, type: string) {
    const blob = data instanceof Blob ? data : new Blob([data], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function buildSimplePdf(text: string) {
    const lines = text.split("\n").slice(0, 60);
    const escapePdf = (s: string) => s.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
    const content = `BT /F1 11 Tf 50 780 Td 14 TL (${lines.map(escapePdf).join(") Tj T* (")}) Tj ET`;
    const parts = [];
    parts.push("%PDF-1.3\n");
    const objs = [];
    objs.push("<< /Type /Catalog /Pages 2 0 R >>");
    objs.push("<< /Type /Pages /Kids [3 0 R] /Count 1 >>");
    objs.push("<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>");
    objs.push(`<< /Length ${content.length} >>\nstream\n${content}\nendstream`);
    objs.push("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
    const offsets: number[] = [];
    let out = "%PDF-1.3\n";
    objs.forEach((o, i) => {
      offsets.push(out.length);
      out += `${i + 1} 0 obj\n${o}\nendobj\n`;
    });
    const xref = out.length;
    out += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n`;
    offsets.forEach((o) => (out += String(o).padStart(10, "0") + " 00000 n \n"));
    out += `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
    return new Blob([out], { type: "application/pdf" });
  }

  return {
    items: filteredItems,
    filter,
    setFilter,
    add,
    remove,
    clear,
    exportCsv,
    exportPdf,
  };
}
