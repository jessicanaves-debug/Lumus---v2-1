"use client";

import { useState } from "react";
import { FileText, MessageSquare, Shield, Menu, X, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { ReportClient } from "@/components/report-client";
import { ResumoTratativaClient } from "@/components/resumo-tratativa-client";

type Tab = "relatorio" | "resumo";

const TABS = [
  {
    id: "relatorio" as Tab,
    label: "Relatório Brand Bidding",
    sublabel: "Gera relatório semanal/quinzenal",
    icon: FileText,
  },
  {
    id: "resumo" as Tab,
    label: "Resumo de Tratativa",
    sublabel: "Resumo via Pipefy",
    icon: MessageSquare,
  },
];

export function AppShell() {
  const [activeTab, setActiveTab] = useState<Tab>("relatorio");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "var(--navy-dark)" }}>
      {/* ── SIDEBAR ────────────────────────────────────────────────── */}
      {/* Overlay mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 flex flex-col w-64 transition-transform duration-300 lg:relative lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
        style={{ background: "var(--navy)", borderRight: "1px solid var(--border)" }}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-5 py-5" style={{ borderBottom: "1px solid var(--border)" }}>
          <div className="flex items-center gap-3">
            <div
              className="flex items-center justify-center w-8 h-8 rounded-lg"
              style={{ background: "var(--teal)" }}
            >
              <Shield size={16} className="text-white" />
            </div>
            <div>
              <span className="text-white font-bold text-base tracking-wide">LUMUS</span>
              <p className="text-xs" style={{ color: "var(--muted)" }}>by Branddi</p>
            </div>
          </div>
          <button
            className="lg:hidden text-white/60 hover:text-white transition-colors"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--muted)" }}>
            Ferramentas
          </p>
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setSidebarOpen(false);
                }}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left transition-all duration-150 group",
                  isActive
                    ? "text-white"
                    : "hover:bg-white/5 text-white/60 hover:text-white"
                )}
                style={
                  isActive
                    ? { background: "var(--navy-light)", borderLeft: "3px solid var(--teal)" }
                    : {}
                }
              >
                <div
                  className={cn(
                    "flex-shrink-0 w-8 h-8 rounded-md flex items-center justify-center transition-colors",
                    isActive ? "" : "group-hover:bg-white/10"
                  )}
                  style={isActive ? { background: "var(--teal)" } : {}}
                >
                  <Icon size={15} className={isActive ? "text-white" : ""} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn("text-sm font-medium leading-tight", isActive ? "text-white" : "")}>
                    {tab.label}
                  </p>
                  <p className="text-xs leading-tight truncate" style={{ color: "var(--muted)" }}>
                    {tab.sublabel}
                  </p>
                </div>
                {isActive && <ChevronRight size={14} className="text-white/40 flex-shrink-0" />}
              </button>
            );
          })}
        </nav>

        {/* Footer sidebar */}
        <div className="px-5 py-4" style={{ borderTop: "1px solid var(--border)" }}>
          <p className="text-xs" style={{ color: "var(--muted)" }}>
            AI Awards 2026 · Branddi Monitor
          </p>
        </div>
      </aside>

      {/* ── MAIN CONTENT ───────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header
          className="flex items-center gap-3 px-4 lg:px-6 h-14 flex-shrink-0"
          style={{ background: "var(--navy)", borderBottom: "1px solid var(--border)" }}
        >
          <button
            className="lg:hidden text-white/60 hover:text-white transition-colors p-1"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={20} />
          </button>

          <div className="flex items-center gap-2">
            {TABS.find((t) => t.id === activeTab) && (() => {
              const tab = TABS.find((t) => t.id === activeTab)!;
              const Icon = tab.icon;
              return (
                <>
                  <Icon size={15} style={{ color: "var(--teal-light)" }} />
                  <span className="text-white text-sm font-medium">{tab.label}</span>
                </>
              );
            })()}
          </div>

          {/* Badge */}
          <div className="ml-auto flex items-center gap-2">
            <div
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
              style={{ background: "rgba(14,124,123,0.15)", color: "var(--teal-light)", border: "1px solid rgba(14,124,123,0.3)" }}
            >
              <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              Gemini IA
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto" style={{ background: "var(--navy-dark)" }}>
          <div className="animate-fade-in">
            {activeTab === "relatorio" && <ReportClient />}
            {activeTab === "resumo" && <ResumoTratativaClient />}
          </div>
        </main>
      </div>
    </div>
  );
}
