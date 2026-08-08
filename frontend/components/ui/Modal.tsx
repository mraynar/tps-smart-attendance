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
        background: "rgba(11, 46, 74, 0.5)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
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
          borderRadius: "16px",
          border: "1px solid rgba(229, 231, 235, 0.8)",
          boxShadow: "0 25px 60px -15px rgba(11, 63, 107, 0.25), 0 0 1px rgba(0,0,0,0.1)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          margin: "0 16px 16px",
        }}
      >
        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "18px 24px",
          borderBottom: "1px solid rgba(229, 231, 235, 0.6)",
          flexShrink: 0,
          background: "#fff",
        }}>
          <h2 id="modal-title" style={{ fontSize: 17, fontWeight: 800, color: "var(--color-text-dark)", margin: 0, letterSpacing: "-0.3px" }}>
            {title}
          </h2>
          <button
            onClick={onClose}
            style={{
              width: 32, height: 32, borderRadius: "50%",
              background: "var(--color-neutral-bg)",
              border: "1px solid rgba(229, 231, 235, 0.6)", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "var(--color-text-muted)",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#FEF2F2";
              e.currentTarget.style.color = "var(--color-danger)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "var(--color-neutral-bg)";
              e.currentTarget.style.color = "var(--color-text-muted)";
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
            borderTop: "1px solid rgba(229, 231, 235, 0.6)",
            background: "rgba(249, 250, 251, 0.8)",
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
