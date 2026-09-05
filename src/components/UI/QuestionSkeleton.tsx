"use client";

export default function QuestionSkeleton() {
  return (
    <div
      className="w-full text-left rounded-xl shadow-sm border border-slate-200 bg-white px-5 py-4 mb-3 grid grid-cols-[auto_1fr] items-center gap-4"
      style={{
        display: "grid",
        gridTemplateColumns: "40px minmax(0, 1fr)",
        alignItems: "center",
        gap: "16px",
        padding: "16px 20px",
        width: "100%",
        height: "72px",
        minHeight: "72px",
        marginBottom: "12px",
        boxSizing: "border-box",
      }}
      aria-hidden="true"
    >
      <div
        className="w-10 h-10 rounded-full bg-slate-200 animate-pulse flex-shrink-0"
        style={{
          width: "40px",
          height: "40px",
          minWidth: "40px",
          minHeight: "40px",
          flex: "0 0 40px",
        }}
      />
      <div className="min-w-0 space-y-2">
        <div className="h-4 w-3/4 rounded bg-slate-200 animate-pulse" />
        <div className="h-4 w-1/2 rounded bg-slate-200 animate-pulse" />
      </div>
    </div>
  );
}
