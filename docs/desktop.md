# Parley desktop

Parley is an unsigned, architecture-specific Electron app following Ariadne's
local desktop packaging. Build on the target platform:

```sh
npm ci
npm run desktop:build
open release/Parley-darwin-arm64/Parley.app
```

The export includes Electron's Node runtime, server, UI and production libraries.
No separate Node installation is required to launch the app. Provider CLIs
(Claude, Codex and Gemini) remain installed and authenticated under your existing
user account. Finder launches recover PATH from your login shell and standard
CLI install locations. No credentials or room records are packaged.

The app connects to `http://127.0.0.1:4142`. It reuses an existing personal-fork
server with runtime protocol 16, leaves that process running on quit, and displays
that server's pinned UI. If the port is occupied by another or incompatible
service, startup fails without stopping it. When the port is free, the app starts
`parley-mine` with `~/.parley-fork`, including its normal desktop runner, and stops
only that child on quit. Existing rooms are used in place, never copied or reset.
As with the CLI, quitting an app-owned backend stops any agent turns it owns.
Closing the last window on macOS leaves the app running; use Cmd-Q to quit.

Development launch: `npm run desktop`. Isolated QA can set both
`PARLEY_DESKTOP_PORT` and `PARLEY_DESKTOP_ROOT` to an unused port and a temporary
absolute directory. An explicit root override refuses an occupied port to avoid attaching to a
different room store. A single-instance lock prevents duplicate
windows/process owners. The native menu supports standard editing, zoom and
opening the app in a browser.

The renderer is sandboxed with context isolation and no Node integration or
preload bridge. External HTTP(S) links open in the system browser; browser
permissions are denied except notifications from the local Parley origin. Backend code is unpacked alongside app.asar so
Electron's bundled Node mode can start real filesystem scripts and child CLIs.
The package is not signed or notarized; macOS may require its normal first-open
approval. Build output lives under ignored `release/` and is not installed into
Applications automatically.

## Validation (2026-10-29)

The arm64 export launched with an isolated temporary room root on port 45942,
rendered its native window, and ran its backend through the bundled Parley
executable in Electron Node mode. The production desktop then attached to the
existing port-4142 server; its original PID remained unchanged and all ten
checked room-data files remained byte-identical. The existing room library
listed FactoryM1 and FactoryM1-M2. Neither room was edited for validation.

`node test/desktop-lifecycle.mjs` passes three mocked boundary checks against the
actual main-process code: a reused backend is never signaled, an app-owned child
receives SIGTERM on quit, and a foreign service causes neither spawn nor signal.
Syntax and packaging checks pass. Native automated Cmd-Q/menu interaction was
unavailable because computer-control permissions were denied; the isolated test
processes were cleaned up by verified PID instead. Actual native quit behavior
was therefore not exercised; the ownership checks above use mocked OS boundaries.
