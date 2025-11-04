# Agent Guidance

## Scope
This file applies to the entire repository.

## Playwright execution
- Prefer `pnpm test:e2e:local:chromium` for sandboxed runs. It relies on the Playwright-bundled Chromium and already sets `PLAYWRIGHT_BROWSERS_PATH=0`.
- Only switch to system Chrome when browser downloads are blocked. Use `pnpm test:e2e:local:chrome`, or the platform-specific `test:e2e:local:chrome:path:*` scripts when you need to set `PW_CHROME_PATH`.
- When running with system Chrome you must set `PW_HOME`, `PW_USER_DATA_DIR`, and `PW_CRASH_DIR` to writable directories (the scripts handle this). Crashpad cannot start inside the sandbox; expect warnings and note that crash reporting remains disabled even with the local crash directory.

Refer to the updated README for the full workflow details.
