#!/usr/bin/env bash
# dev.sh — Single-command dev runner for TPS Smart Attendance
# Usage: ./dev.sh
# Ctrl+C once will gracefully stop ALL services (backend, frontend, supabase)

set -euo pipefail

# ─── ANSI Colors ─────────────────────────────────────────────────────────────
RESET="\033[0m"
BOLD="\033[1m"
C_SUP="\033[1;36m"   # Cyan   → Supabase
C_BKD="\033[1;33m"   # Yellow → Backend
C_FRT="\033[1;32m"   # Green  → Frontend
C_SYS="\033[1;35m"   # Purple → System messages

# ─── Logging helpers ─────────────────────────────────────────────────────────
log_system()  { echo -e "${C_SYS}[SYSTEM]${RESET}   $*"; }
log_supabase(){ echo -e "${C_SUP}[SUPABASE]${RESET} $*"; }
log_backend() { echo -e "${C_BKD}[BACKEND]${RESET}  $*"; }
log_frontend(){ echo -e "${C_FRT}[FRONTEND]${RESET} $*"; }

# ─── Root dir of the project (wherever this script lives) ────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# PIDs of background processes we spawn
BACKEND_PID=""
FRONTEND_PID=""

# ─── Cleanup: called on EXIT / SIGINT / SIGTERM ───────────────────────────────
cleanup() {
  echo ""
  log_system "Ctrl+C detected — shutting down all services…"

  # Kill frontend
  if [[ -n "$FRONTEND_PID" ]] && kill -0 "$FRONTEND_PID" 2>/dev/null; then
    log_frontend "Stopping (PID $FRONTEND_PID)…"
    kill -TERM "$FRONTEND_PID" 2>/dev/null || true
    # Kill any stray next-server processes on port 3000
    lsof -ti :3000 | xargs kill -9 2>/dev/null || true
  fi

  # Kill backend
  if [[ -n "$BACKEND_PID" ]] && kill -0 "$BACKEND_PID" 2>/dev/null; then
    log_backend "Stopping (PID $BACKEND_PID)…"
    kill -TERM "$BACKEND_PID" 2>/dev/null || true
    # Kill any stray uvicorn processes on port 8000
    lsof -ti :8000 | xargs kill -9 2>/dev/null || true
  fi

  # Kill all remaining background jobs spawned by this script
  jobs -p | xargs kill 2>/dev/null || true

  # Stop Supabase last
  log_supabase "Running 'supabase stop'…"
  (cd "$SCRIPT_DIR" && supabase stop) 2>&1 | while IFS= read -r line; do
    log_supabase "$line"
  done

  log_system "${BOLD}All services stopped. Bye!${RESET}"
  exit 0
}

trap cleanup EXIT INT TERM

# ─── Preflight checks ────────────────────────────────────────────────────────
log_system "Checking dependencies…"

command -v supabase >/dev/null 2>&1 || { log_system "ERROR: 'supabase' CLI not found."; exit 1; }
command -v npm      >/dev/null 2>&1 || { log_system "ERROR: 'npm' not found."; exit 1; }
[[ -f "$SCRIPT_DIR/venv/bin/activate" ]] || { log_system "ERROR: Python venv not found at '$SCRIPT_DIR/venv/'. Run: python -m venv venv && pip install -r backend/requirements.txt"; exit 1; }

# ─── 1. Start Supabase (blocking — waits until all containers are healthy) ───
log_supabase "Starting Supabase… (this may take a minute on first run)"
(
  cd "$SCRIPT_DIR"
  supabase start 2>&1 | while IFS= read -r line; do
    log_supabase "$line"
  done
)
log_supabase "${BOLD}Supabase ready!${RESET}"

# ─── 2. Start Backend (FastAPI via uvicorn) ───────────────────────────────────
log_backend "Starting FastAPI backend…"
(
  cd "$SCRIPT_DIR"
  # shellcheck disable=SC1091
  source venv/bin/activate
  cd backend
  uvicorn app.main:app --reload 2>&1 | while IFS= read -r line; do
    log_backend "$line"
  done
) &
BACKEND_PID=$!
log_backend "Backend process started (PID $BACKEND_PID)"

# Brief pause to let uvicorn bind to its port
sleep 2

# ─── 3. Start Frontend (Next.js) ─────────────────────────────────────────────
log_frontend "Starting Next.js frontend…"
(
  cd "$SCRIPT_DIR/frontend"
  npm run dev 2>&1 | while IFS= read -r line; do
    log_frontend "$line"
  done
) &
FRONTEND_PID=$!
log_frontend "Frontend process started (PID $FRONTEND_PID)"

# ─── All up ───────────────────────────────────────────────────────────────────
echo ""
log_system "${BOLD}═══════════════════════════════════════════════════════${RESET}"
log_system "${BOLD}  All services running!${RESET}"
log_system "  ${C_SUP}Supabase Studio${RESET}  → http://localhost:54323"
log_system "  ${C_BKD}FastAPI Backend${RESET}  → http://localhost:8000"
log_system "  ${C_FRT}Next.js Frontend${RESET} → http://localhost:3000"
log_system "${BOLD}  Press Ctrl+C ONCE to stop everything.${RESET}"
log_system "${BOLD}═══════════════════════════════════════════════════════${RESET}"
echo ""

# Block until a background job exits (crash) — then cleanup fires
wait "$BACKEND_PID" "$FRONTEND_PID"
