/**
 * Binds PORT during prisma migrate so ingress/probes see HTTP 200 instead of 502.
 * Killed by entrypoint before Next.js starts.
 */
const http = require('http');

const port = Number(process.env.PORT || 3000);
const host = process.env.HOSTNAME || '0.0.0.0';

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('nexaapp: starting (database migration in progress)\n');
});

server.listen(port, host, () => {
  console.log(`[startup-shim] listening on ${host}:${port} until migrate completes`);
});

process.on('SIGTERM', () => server.close(() => process.exit(0)));
process.on('SIGINT', () => server.close(() => process.exit(0)));
