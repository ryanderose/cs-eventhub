import { createApp } from '../../src/app';

const PORT = Number.parseInt(process.env.PORT ?? '4000', 10);
const HOST = process.env.HOST ?? '0.0.0.0';

const app = createApp();

app.listen(PORT, HOST, () => {
  console.log(`[api] listening on http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}`);
});
