#!/usr/bin/env python3
import argparse
import os
import socket
import shutil
import signal
import subprocess
import sys
import time
from pathlib import Path
from urllib.parse import urlparse


ROOT = Path(__file__).resolve().parent


def load_dotenv(path: Path) -> dict[str, str]:
    values: dict[str, str] = {}
    if not path.exists():
        return values

    for raw_line in path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        values[key.strip()] = value.strip().strip('"').strip("'")
    return values


def get_pnpm_base_command() -> list[str]:
    corepack_cmd = shutil.which("corepack.cmd") or shutil.which("corepack")
    if corepack_cmd:
        return [corepack_cmd, "pnpm"]

    appdata = os.getenv("APPDATA", "")
    pnpm_cjs = Path(appdata) / "npm" / "node_modules" / "pnpm" / "bin" / "pnpm.cjs"
    if pnpm_cjs.exists():
        npx_cmd = shutil.which("npx.cmd") or shutil.which("npx")
        if npx_cmd:
            return [npx_cmd, "-y", "node@20.20.2", str(pnpm_cjs)]

    pnpm_cmd = shutil.which("pnpm.cmd") or shutil.which("pnpm")
    if pnpm_cmd:
        return [pnpm_cmd]

    node_cmd = shutil.which("node")
    if node_cmd and pnpm_cjs.exists():
        return [node_cmd, str(pnpm_cjs)]

    raise RuntimeError("pnpm was not found. Install pnpm first.")


def is_port_open(port: int) -> bool:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
        sock.settimeout(0.3)
        return sock.connect_ex(("127.0.0.1", port)) == 0


def get_database_port(database_url: str) -> int | None:
    try:
        parsed = urlparse(database_url)
    except ValueError:
        return None

    if parsed.hostname not in {"localhost", "127.0.0.1", "::1"}:
        return None

    return parsed.port or 5432


def start_docker_desktop_if_available() -> bool:
    if os.name != "nt":
        return False

    candidates = [
        Path(os.environ.get("ProgramFiles", "C:\\Program Files"))
        / "Docker"
        / "Docker"
        / "Docker Desktop.exe",
        Path(os.environ.get("LOCALAPPDATA", ""))
        / "Programs"
        / "Docker"
        / "Docker"
        / "Docker Desktop.exe",
    ]

    for candidate in candidates:
        if candidate.exists():
            print("[db] Starting Docker Desktop...", flush=True)
            subprocess.Popen(
                [str(candidate)],
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
            )
            return True

    return False


def wait_for_docker(docker_cmd: str, timeout_seconds: int = 120) -> bool:
    deadline = time.time() + timeout_seconds
    while time.time() < deadline:
        result = subprocess.run(
            [docker_cmd, "info"],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            check=False,
        )
        if result.returncode == 0:
            return True
        time.sleep(2)

    return False


def is_wsl_available() -> bool:
    if os.name != "nt":
        return True

    wsl_cmd = shutil.which("wsl.exe") or shutil.which("wsl")
    if not wsl_cmd:
        return False

    result = subprocess.run(
        [wsl_cmd, "--status"],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
        check=False,
    )
    return result.returncode == 0


def ensure_postgres_running(env: dict[str, str]) -> None:
    database_url = env.get("DATABASE_URL", "")
    db_port = get_database_port(database_url)
    if not db_port or is_port_open(db_port):
        return

    docker_cmd = shutil.which("docker.cmd") or shutil.which("docker")
    compose_file = ROOT / "docker-compose.yml"
    if not docker_cmd or not compose_file.exists():
        raise RuntimeError(
            f"Postgres is not reachable on port {db_port}. Start your database first "
            "or install Docker Desktop so run.py can start it automatically."
        )

    if not wait_for_docker(docker_cmd, timeout_seconds=5):
        started = start_docker_desktop_if_available()
        if not started or not wait_for_docker(docker_cmd):
            wsl_hint = (
                " WSL is not ready on this machine; run 'wsl --install --no-distribution' "
                "from an Administrator terminal and restart Windows if prompted."
                if os.name == "nt" and not is_wsl_available()
                else ""
            )
            raise RuntimeError(
                "Docker Desktop is not running. Start Docker Desktop, wait until it finishes loading, "
                f"then rerun python run.py.{wsl_hint}"
            )

    print("[db] Starting local Postgres with Docker Compose...", flush=True)
    result = subprocess.run(
        [docker_cmd, "compose", "up", "-d", "postgres"],
        cwd=ROOT,
        env=env,
        text=True,
        capture_output=True,
        check=False,
    )

    if result.returncode != 0:
        details = (result.stderr or result.stdout).strip()
        raise RuntimeError(f"Failed to start Postgres with Docker Compose. {details}")

    deadline = time.time() + 60
    while time.time() < deadline:
        if is_port_open(db_port):
            print(f"[db] Postgres is ready on port {db_port}.", flush=True)
            return
        time.sleep(1)

    raise RuntimeError(f"Postgres did not become ready on port {db_port} within 60 seconds.")


def get_listening_pids_on_windows_port(port: int) -> set[int]:
    pids: set[int] = set()
    try:
        result = subprocess.run(
            ["netstat", "-ano", "-p", "tcp"],
            capture_output=True,
            text=True,
            check=False,
        )
    except OSError:
        return pids

    needle = f":{port}"
    for line in result.stdout.splitlines():
        if "LISTENING" not in line or needle not in line:
            continue
        parts = line.split()
        if len(parts) < 5:
            continue
        local_addr = parts[1]
        if not local_addr.endswith(needle):
            continue
        try:
            pids.add(int(parts[-1]))
        except ValueError:
            pass
    return pids


def get_project_pids_windows() -> set[int]:
    script = rf"""
$root = '{str(ROOT).replace("'", "''")}'
Get-CimInstance Win32_Process |
  Where-Object {{
    $_.CommandLine -and
    $_.CommandLine -like "*$root*" -and
    (
      $_.CommandLine -like "*vite --config vite.config.ts*" -or
      $_.CommandLine -like "*@workspace/api-server*" -or
      $_.CommandLine -like "*run.py*" -or
      $_.CommandLine -like "*pnpm.cjs*" -or
      $_.CommandLine -like "*dev-local.mjs*"
    )
  }} |
  Select-Object -ExpandProperty ProcessId
"""
    try:
        result = subprocess.run(
            ["powershell", "-NoProfile", "-Command", script],
            capture_output=True,
            text=True,
            check=False,
        )
    except OSError:
        return set()

    pids: set[int] = set()
    for line in result.stdout.splitlines():
        line = line.strip()
        if not line:
            continue
        try:
            pids.add(int(line))
        except ValueError:
            pass
    return pids


def kill_pid(pid: int) -> None:
    if pid == os.getpid():
        return

    if os.name == "nt":
        subprocess.run(
            ["taskkill", "/PID", str(pid), "/T", "/F"],
            capture_output=True,
            text=True,
            check=False,
        )
        return

    try:
        os.kill(pid, signal.SIGTERM)
    except OSError:
        pass


def kill_old_dev_processes(force: bool, ports: tuple[int, int]) -> None:
    if not force:
        return

    to_kill: set[int] = set()
    web_port, api_port = ports

    if os.name == "nt":
        to_kill |= get_listening_pids_on_windows_port(web_port)
        to_kill |= get_listening_pids_on_windows_port(api_port)
        to_kill |= get_project_pids_windows()

    if not to_kill:
        print("[force] No old dev processes found.", flush=True)
        return

    print(f"[force] Stopping old dev processes: {sorted(to_kill)}", flush=True)
    for pid in sorted(to_kill):
        kill_pid(pid)

    time.sleep(1.0)


def start(name: str, args: list[str], env: dict[str, str]) -> subprocess.Popen:
    print(f"[start] {name}: {' '.join(args)}", flush=True)
    if os.name == "nt" and args[0].lower().endswith(".cmd"):
        command_str = subprocess.list2cmdline(args)
        return subprocess.Popen(command_str, cwd=ROOT, env=env, shell=True)
    return subprocess.Popen(args, cwd=ROOT, env=env)


def terminate_all(processes: list[subprocess.Popen]) -> None:
    for proc in processes:
        if proc.poll() is None:
            proc.terminate()

    deadline = time.time() + 8
    while time.time() < deadline:
        if all(proc.poll() is not None for proc in processes):
            return
        time.sleep(0.2)

    for proc in processes:
        if proc.poll() is None:
            proc.kill()


def main() -> int:
    parser = argparse.ArgumentParser(description="Run Glow-Cycle frontend and backend.")
    parser.add_argument(
        "--force",
        action="store_true",
        help="Auto-kill old Glow-Cycle dev processes and free configured ports before starting.",
    )
    cli = parser.parse_args()

    env = os.environ.copy()
    env.update(load_dotenv(ROOT / ".env"))
    env.setdefault("NODE_ENV", "development")
    env.setdefault("API_PORT", "8081")
    env.setdefault("WEB_PORT", "8080")
    env.setdefault("BASE_PATH", "/")
    env.setdefault("API_SERVER_URL", f"http://localhost:{env['API_PORT']}")
    api_port = int(env["API_PORT"])
    web_port = int(env["WEB_PORT"])
    kill_old_dev_processes(cli.force, (web_port, api_port))
    ensure_postgres_running(env)

    for port, name in ((web_port, "frontend"), (api_port, "backend")):
        if is_port_open(port):
            raise RuntimeError(
                f"Port {port} is already in use. Stop existing process on {name} port and rerun, "
                "or start with --force."
            )

    pnpm_base = get_pnpm_base_command()
    backend_cmd = pnpm_base + ["--filter", "@workspace/api-server", "run", "dev"]
    frontend_cmd = pnpm_base + ["--filter", "@workspace/glowcycle", "run", "dev"]

    processes = [
        start("backend", backend_cmd, env),
        start("frontend", frontend_cmd, env),
    ]

    def _handle_signal(_sig, _frame):
        print("\n[stop] Shutting down backend and frontend...", flush=True)
        terminate_all(processes)
        sys.exit(0)

    signal.signal(signal.SIGINT, _handle_signal)
    signal.signal(signal.SIGTERM, _handle_signal)

    print(f"\nFrontend: http://localhost:{web_port}", flush=True)
    print(f"API:      http://localhost:{api_port}/api/healthz\n", flush=True)

    while True:
        for proc in processes:
            code = proc.poll()
            if code is not None:
                if code != 0:
                    print(f"[error] Process exited with code {code}", flush=True)
                terminate_all(processes)
                return code
        time.sleep(0.5)


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except RuntimeError as exc:
        print(f"[error] {exc}", flush=True)
        raise SystemExit(1)
