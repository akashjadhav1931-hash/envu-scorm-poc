const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const ROOT = __dirname;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js':   'application/javascript; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.json': 'application/json',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg':  'image/svg+xml',
  '.gif':  'image/gif',
  '.ico':  'image/x-icon',
  '.ttf':  'font/ttf',
  '.woff': 'font/woff',
  '.woff2':'font/woff2',
  '.mp3':  'audio/mpeg',
  '.mp4':  'video/mp4',
  '.webp': 'image/webp',
  '.xml':  'application/xml',
};

const server = http.createServer((req, res) => {
  // Decode URL and strip query string
  let urlPath = decodeURIComponent(req.url.split('?')[0]);
  
  // Default to genially.html
  if (urlPath === '/' || urlPath === '') {
    urlPath = '/genially.html';
  }

  const filePath = path.join(ROOT, urlPath);

  // Security: prevent directory traversal
  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  fs.stat(filePath, (err, stat) => {
    if (err || !stat.isFile()) {
      console.log(`[404] ${urlPath}`);
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end(`404 Not Found: ${urlPath}`);
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, {
      'Content-Type': contentType,
      'Content-Length': stat.size,
      // Allow iframe embedding (needed for scorm-player.html → genially.html iframe)
      'X-Frame-Options': 'SAMEORIGIN',
      'Access-Control-Allow-Origin': '*',
    });

    const stream = fs.createReadStream(filePath);
    stream.pipe(res);

    stream.on('error', (streamErr) => {
      console.error(`[ERROR] ${urlPath}:`, streamErr.message);
    });
  });

  // Log all requests
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
});

server.listen(PORT, () => {
  console.log('');
  console.log('========================================');
  console.log('  SCORM Package Static Server — READY');
  console.log('========================================');
  console.log(`  Serving: ${ROOT}`);
  console.log(`  Genially course: http://localhost:${PORT}/genially.html`);
  console.log(`  SCORM Player:    http://localhost:${PORT}/scorm-player.html`);
  console.log('  Press Ctrl+C to stop.');
  console.log('========================================');
  console.log('');
});
