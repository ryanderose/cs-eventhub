import { bootstrap } from '../../src';

const DEFAULT_TELEMETRY_MODE = 'dev';

async function start() {
  const telemetryMode = process.env.TELEMETRY_MODE ?? DEFAULT_TELEMETRY_MODE;
  try {
    const { port, host } = await bootstrap({ telemetryMode });
    // eslint-disable-next-line no-console
    console.info(
      `[api] local adapter listening on http://${host}:${port} (telemetry=${process.env.TELEMETRY_MODE})`
    );
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[api] failed to start local adapter', error);
    process.exitCode = 1;
  }
}

void start();
