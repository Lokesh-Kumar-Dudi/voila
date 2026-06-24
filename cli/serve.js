"use strict";

/*
 * Minimal zero-dependency static server for local preview.
 * Invoked via `vla serve`.
 */

const fs = require("fs");
const path = require("path");
const http = require("http");

const ROOT = path.resolve(__dirname, "..");

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".ico": "image/x-icon",
};

const DEFAULT_PORT = 3611;

function serve({ port } = {}) {
  const requested = Number(port) || Number(process.env.PORT) || DEFAULT_PORT;
  // Only auto-advance to a free port when the port wasn't explicitly chosen.
  const explicit = port != null || process.env.PORT != null;

  const server = http.createServer((req, res) => {
    const urlPath = decodeURIComponent(req.url.split("?")[0]);
    const rel = urlPath === "/" ? "/index.html" : urlPath;

    // Resolve and keep the request confined to ROOT.
    const filePath = path.join(ROOT, rel);
    if (!filePath.startsWith(ROOT)) {
      res.writeHead(403).end("Forbidden");
      return;
    }

    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(404, { "Content-Type": "text/plain" }).end("Not found");
        return;
      }
      const type = MIME[path.extname(filePath)] || "application/octet-stream";
      res.writeHead(200, { "Content-Type": type, "Cache-Control": "no-store" });
      res.end(data);
    });
  });

  const MAX_TRIES = 20;
  let current = requested;

  server.on("error", (err) => {
    if (err.code === "EADDRINUSE") {
      if (!explicit && current - requested < MAX_TRIES) {
        console.log(`Port ${current} in use, trying ${current + 1}…`);
        current++;
        server.listen(current);
        return;
      }
      console.error(`Port ${current} is already in use. Pick another: vla serve --port <n>`);
      process.exit(1);
    }
    console.error(err.message);
    process.exit(1);
  });

  server.on("listening", () => {
    console.log(`Serving ${ROOT}\n  http://localhost:${server.address().port}`);
  });

  server.listen(current);
  return server;
}

module.exports = { serve };

if (require.main === module) serve();
