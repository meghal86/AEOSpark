"use client";

import { useState } from "react";

export function MobileNavWrapper({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="md:hidden">
      <button
        aria-label={isOpen ? "Close menu" : "Open menu"}
        className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[rgba(72,52,40,0.12)] bg-[rgba(255,252,247,0.82)] transition hover:bg-[rgba(247,238,227,0.98)]"
        onClick={() => setIsOpen((current) => !current)}
        type="button"
      >
        {isOpen ? (
          <svg className="h-5 w-5 text-stone-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="h-5 w-5 text-stone-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        )}
      </button>

      {isOpen && (
        <div className="app-slide-down absolute left-0 right-0 top-full z-50 mt-2 px-6">
          <nav className="surface-panel grid gap-1 rounded-2xl p-3 shadow-xl">
            {children}
          </nav>
        </div>
      )}
    </div>
  );
}
