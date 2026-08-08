import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "TPS Smart Attendance",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--color-neutral-bg)" }}>
      <Sidebar />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <Header />
        <main style={{
          flex: 1,
          padding: "32px 36px",
          width: "100%",
          maxWidth: 1600,
          margin: "0 auto",
          boxSizing: "border-box",
        }}>
          {children}
        </main>
      </div>
    </div>
  );
}
