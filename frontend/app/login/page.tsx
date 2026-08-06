"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Eye, EyeOff, LogIn, Shield, Activity, Truck } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError("Email atau password salah. Silakan coba lagi.");
    } else {
      router.push("/");
      router.refresh();
    }
    setLoading(false);
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: "var(--font-family-sans)" }}>
      {/* ── LEFT PANEL: Pelindo Hero ── */}
      <div
        style={{
          flex: "0 0 480px",
          background: "linear-gradient(160deg, var(--color-primary-dark) 0%, var(--color-primary) 60%, var(--color-primary-light) 100%)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "48px",
          position: "relative",
          overflow: "hidden",
        }}
        className="login-hero"
      >
        {/* Decorative circles */}
        <div style={{
          position: "absolute", top: "-80px", right: "-80px",
          width: "320px", height: "320px",
          borderRadius: "50%",
          background: "rgba(255,255,255,0.05)",
        }} />
        <div style={{
          position: "absolute", bottom: "80px", left: "-60px",
          width: "240px", height: "240px",
          borderRadius: "50%",
          background: "rgba(255,255,255,0.04)",
        }} />
        <div style={{
          position: "absolute", bottom: "-40px", right: "40px",
          width: "160px", height: "160px",
          borderRadius: "50%",
          background: "rgba(255,255,255,0.06)",
        }} />

        {/* Logo & Brand */}
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ marginBottom: "48px" }}>
            <Image
              src="/Images/Logo/Logo TPS Monokrom.png"
              alt="Logo TPS"
              width={180}
              height={60}
              unoptimized
              style={{
                display: "block",
                height: "60px",
                width: "auto",
              }}
              priority
            />
          </div>

          <h1 style={{ color: "#fff", fontSize: 36, fontWeight: 800, lineHeight: 1.2, marginBottom: 16, letterSpacing: "-0.5px" }}>
            Selamat Datang<br />di Dashboard TPS
          </h1>
          <p style={{ color: "rgba(255,255,255,0.75)", fontSize: 16, lineHeight: 1.6, maxWidth: "320px" }}>
            Platform monitoring absensi wajah dan deteksi plat nomor kendaraan Terminal Petikemas Surabaya.
          </p>
        </div>

        {/* Feature pills */}
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[
              { icon: <Shield size={16} />, text: "Verifikasi Wajah dengan Liveness Detection" },
              { icon: <Truck size={16} />, text: "Deteksi Plat Nomor Kendaraan (ANPR)" },
              { icon: <Activity size={16} />, text: "Monitoring Real-Time & Laporan Historis" },
            ].map((f, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "12px 16px",
                background: "rgba(255,255,255,0.1)",
                backdropFilter: "blur(8px)",
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.15)",
              }}>
                <span style={{ color: "rgba(255,255,255,0.9)" }}>{f.icon}</span>
                <span style={{ color: "rgba(255,255,255,0.85)", fontSize: 13, fontWeight: 500 }}>{f.text}</span>
              </div>
            ))}
          </div>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, marginTop: 32 }}>
            © 2026 Terminal Petikemas Surabaya · Pelindo Group
          </p>
        </div>
      </div>

      {/* ── RIGHT PANEL: Login Form ── */}
      <div style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--color-neutral-bg)",
        padding: "48px 32px",
      }}>
        <div style={{
          width: "100%",
          maxWidth: 440,
          background: "#ffffff",
          padding: "40px",
          borderRadius: 16,
          boxShadow: "0 1px 3px rgba(11,63,107,0.02), 0 8px 24px rgba(11,63,107,0.04)",
          border: "1px solid rgba(229, 231, 235, 0.5)",
        }} className="animate-fade-in-up">
          {/* Mobile Logo */}
          <div className="mobile-logo-wrapper" style={{ display: "none", justifyContent: "center", marginBottom: 32 }}>
            <Image
              src="/Images/Logo/Logo_TPS.png"
              alt="Logo TPS"
              width={154}
              height={48}
              unoptimized
              style={{
                display: "block",
                height: "48px",
                width: "auto",
              }}
              priority
            />
          </div>
          <div style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 24, fontWeight: 800, color: "var(--color-text-dark)", marginBottom: 8, letterSpacing: "-0.5px" }}>
              Masuk ke Dashboard
            </h2>
            <p style={{ fontSize: 14, color: "var(--color-text-muted)" }}>
              Gunakan akun administrator TPS Anda
            </p>
          </div>

          <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            {/* Email */}
            <div>
              <label htmlFor="login-email" className="form-label">Email</label>
              <input
                id="login-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
                placeholder="admin@tps.co.id"
                autoComplete="email"
                style={{
                  border: "1.5px solid rgba(229, 231, 235, 0.8)",
                  borderRadius: 10,
                  height: 40,
                  fontSize: 14,
                }}
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="login-password" className="form-label">Password</label>
              <div style={{ position: "relative" }}>
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  style={{
                    paddingRight: 44,
                    border: "1.5px solid rgba(229, 231, 235, 0.8)",
                    borderRadius: 10,
                    height: 40,
                    fontSize: 14,
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                    background: "none", border: "none", cursor: "pointer",
                    color: "var(--color-text-muted)", padding: 4,
                  }}
                  aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Error message */}
            {error && (
              <div style={{
                padding: "10px 14px",
                background: "#FEF2F2",
                border: "1px solid #FECACA",
                borderRadius: 10,
                color: "var(--color-danger)",
                fontSize: 13,
                fontWeight: 600,
              }}>
                {error}
              </div>
            )}

            <button
              id="btn-login"
              type="submit"
              disabled={loading}
              className="btn-primary"
              style={{
                justifyContent: "center",
                padding: "12px 24px",
                fontSize: 15,
                opacity: loading ? 0.7 : 1,
                cursor: loading ? "not-allowed" : "pointer",
                marginTop: 4,
                height: 42,
                borderRadius: 10,
              }}
            >
              {loading ? (
                <>
                  <div style={{
                    width: 16, height: 16, border: "2px solid rgba(255,255,255,0.4)",
                    borderTopColor: "#fff", borderRadius: "50%",
                    animation: "spin 0.8s linear infinite",
                  }} />
                  Memproses...
                </>
              ) : (
                <>
                  <LogIn size={16} />
                  Masuk
                </>
              )}
            </button>
          </form>

          <p style={{ marginTop: 24, fontSize: 12, color: "var(--color-text-muted)", textAlign: "center", fontWeight: 500 }}>
            Sistem ini hanya untuk personel yang berwenang.
          </p>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 768px) {
          .login-hero { display: none !important; }
          .mobile-logo-wrapper { display: flex !important; }
        }
      `}</style>
    </div>
  );
}
