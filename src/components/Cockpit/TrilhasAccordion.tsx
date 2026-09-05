"use client";

import { useState } from "react";
import { ChevronDown, CheckCircle2, Circle } from "lucide-react";

interface TrilhasAccordionTopic {
  id: string;
  label: string;
  done?: boolean;
}

interface TrilhasAccordionProps {
  title: string;
  topics: TrilhasAccordionTopic[];
  progressPercent?: number;
}

export default function TrilhasAccordion({
  title,
  topics,
  progressPercent,
}: TrilhasAccordionProps) {
  const [open, setOpen] = useState(false);

  const done = topics.filter((t) => t.done).length;
  const pct =
    progressPercent ??
    (topics.length > 0 ? Math.round((done / topics.length) * 100) : 0);

  return (
    <div style={{ overflow: "hidden", borderRadius: "12px", border: "1px solid #e2e8f0", backgroundColor: "#ffffff", boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)" }}>
      {/* ── Header ── */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{ display: "block", width: "100%", textAlign: "left", cursor: "pointer", background: "transparent", border: "none", padding: 0 }}
        aria-expanded={open}
      >
        <div style={{ display: "flex", width: "100%", alignItems: "center", justifyContent: "space-between", padding: "20px 24px", gap: "16px" }}>
          
          {/* Left: title + fraction */}
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <h3 style={{ fontSize: "16px", fontWeight: 600, color: "#1e293b", margin: 0, lineHeight: 1.25 }}>
              {title}
            </h3>
            <p style={{ fontSize: "14px", color: "#64748b", margin: 0, lineHeight: 1.25 }}>
              {done}/{topics.length} tópicos
            </p>
          </div>

          {/* Right: percent + progress bar + chevron */}
          <div style={{ display: "flex", alignItems: "center", gap: "16px", flexShrink: 0 }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "6px" }}>
              <span style={{ fontSize: "14px", fontWeight: 700, fontVariantNumeric: "tabular-nums", color: "#059669", lineHeight: 1 }}>
                {pct}%
              </span>
              <div style={{ height: "6px", width: "96px", overflow: "hidden", borderRadius: "9999px", backgroundColor: "#e2e8f0" }}>
                <div
                  style={{ height: "100%", borderRadius: "9999px", backgroundColor: "#10b981", transition: "all 0.5s ease", width: `${pct}%` }}
                />
              </div>
            </div>
            <ChevronDown
              size={20}
              color="#94a3b8"
              style={{ flexShrink: 0, transition: "transform 0.2s ease", transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
            />
          </div>
        </div>
      </button>

      {/* ── Topics list ── */}
      {open && (
        <ul style={{ margin: 0, padding: "0 24px", listStyle: "none", borderTop: "1px solid #f1f5f9" }}>
          {topics.map((topic) => (
            <li key={topic.id} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 0", fontSize: "14px", borderBottom: "1px solid #f1f5f9" }}>
              {topic.done ? (
                <CheckCircle2 size={18} color="#10b981" style={{ flexShrink: 0 }} />
              ) : (
                <Circle size={18} color="#cbd5e1" style={{ flexShrink: 0 }} />
              )}
              <span style={{ color: topic.done ? "#94a3b8" : "#334155", textDecoration: topic.done ? "line-through" : "none" }}>
                {topic.label}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
