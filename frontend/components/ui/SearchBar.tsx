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
        size={16}
        style={{
          position: "absolute", left: 14, top: "50%",
          transform: "translateY(-50%)",
          color: "var(--color-text-muted)",
          pointerEvents: "none",
        }}
      />
      <input
        id={id}
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="input-field"
        style={{ paddingLeft: 40, borderRadius: 999 }}
      />
    </div>
  );
}
