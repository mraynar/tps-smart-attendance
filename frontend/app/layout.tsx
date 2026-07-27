import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TPS Smart Attendance — Terminal Petikemas Surabaya",
  description:
    "Dashboard internal monitoring absensi wajah dan deteksi plat nomor kendaraan di Terminal Petikemas Surabaya (TPS), anak perusahaan Pelindo.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
