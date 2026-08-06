"use client";

import { Search } from "lucide-react";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  id?: string;
}

export default function SearchBar({
  value,
  onChange,
  placeholder = "Cari...",
  id = "search-bar",
}: SearchBarProps) {
  return (
    <div style={{ position: "relative", maxWidth: 320, width: "100%" }}>
      <Search
        size={15}
        style={{
          position: "absolute", left: 16, top: "50%",
          transform: "translateY(-50%)",
          color: "var(--color-text-muted)",
          pointerEvents: "none",
          transition: "color 0.2s ease",
        }}
      />
      <input
        id={id}
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="input-field"
        style={{
          paddingLeft: 42,
          paddingRight: 16,
          borderRadius: 999,
          fontSize: 13.5,
          height: 38,
          border: "1.5px solid rgba(229, 231, 235, 0.8)",
          boxShadow: "0 1px 2px rgba(0, 0, 0, 0.02)",
        }}
      />
    </div>
  );
}
