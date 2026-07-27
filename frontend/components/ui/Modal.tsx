"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: number;
}

export default function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  maxWidth = 520,
}: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        display: "flex", alignItems: "flex-end", justifyContent: "center",
        background: "rgba(10,42,74,0.45)",
        backdropFilter: "blur(4px)",
        animation: "fadeIn 0.2s ease",
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      {/* Desktop: center; Mobile: bottom sheet */}
      <div
        ref={dialogRef}
        className="animate-scale-in"
        style={{
          width: "100%",
          maxWidth,
          maxHeight: "90vh",
          background: "#fff",
          borderRadius: "20px 20px 20px 20px",
          boxShadow: "0 24px 64px rgba(10,42,74,0.18), 0 4px 16px rgba(0,0,0,0.08)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          margin: "0 16px 16px",
        }}
      >
        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "20px 24px",
          borderBottom: "1px solid #F3F4F6",
          flexShrink: 0,
        }}>
          <h2 id="modal-title" style={{ fontSize: 18, fontWeight: 700, color: "var(--color-text-dark)", margin: 0 }}>
            {title}
          </h2>
          <button
            onClick={onClose}
            style={{
              width: 32, height: 32, borderRadius: "50%",
              background: "var(--color-neutral-bg)",
              border: "none", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "var(--color-text-muted)",
            }}
            aria-label="Tutup modal"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, padding: "24px", overflowY: "auto" }}>
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div style={{
            padding: "16px 24px",
            borderTop: "1px solid #F3F4F6",
            display: "flex", gap: 12, justifyContent: "flex-end",
            flexShrink: 0,
          }}>
            {footer}
          </div>
        )}
      </div>

      <style>{`
        @media (min-width: 640px) {
          [role="dialog"] {
            align-items: center !important;
          }
        }
      `}</style>
    </div>
  );
}
