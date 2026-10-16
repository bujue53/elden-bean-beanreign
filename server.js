// 零依赖的本地静态文件服务器：node server.js
// 参数 --no-open 可禁止自动打开浏览器；端口被占用时会自动往后找可用端口
const http = require("http");
const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

const root = __dirname;
const port = Number(process.env.PORT || 8123);
let listenPort = port;
const noOpen = process.argv.includes("--no-open") || Boolean(process.env.NO_OPEN);

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".glb": "model/gltf-binary",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".mp3": "audio/mpeg",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
};

function openBrowser(url) {
  try {
    let child;
    if (process.platform === "win32") {
      child = spawn("cmd", ["/c", "start", "", url], { detached: true, stdio: "ignore", windowsHide: true });
    } else if (process.platform === "darwin") {
      child = spawn("open", [url], { detached: true, stdio: "ignore" });
    } else {
      child = spawn("xdg-open", [url], { detached: true, stdio: "ignore" });
    }
    child.unref();
    child.on("error", () => {
      console.log("Could not open the browser automatically. Please open the URL manually.");
    });
  } catch (err) {
    console.log("Could not open the browser automatically. Please open the URL manually.");
  }
}

const server = http.createServer((req, res) => {
    let urlPath;
    try {
      urlPath = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
    } catch {
      res.writeHead(400);
      res.end("Bad Request");
      return;
    }

    if (urlPath.endsWith("/")) urlPath += "index.html";
    const filePath = path.normalize(path.join(root, urlPath));

    // 防目录穿越
    const relative = path.relative(root, filePath);
    if (relative === ".." || relative.startsWith(".." + path.sep) || path.isAbsolute(relative)
      || relative.split(path.sep).some((part) => part.startsWith("."))) {
      res.writeHead(403);
      res.end("Forbidden");
      return;
    }

    fs.stat(filePath, (err, stat) => {
      if (err || !stat.isFile()) {
        res.writeHead(404);
        res.end("Not Found");
        return;
      }
      const ext = path.extname(filePath).toLowerCase();
      res.writeHead(200, {
        "Content-Type": MIME[ext] || "application/octet-stream",
        "Cache-Control": "no-cache",
      });
      fs.createReadStream(filePath).pipe(res);
    });
  });

server.on("error", (err) => {
  if (err.code === "EADDRINUSE" && listenPort < Math.min(port + 20, 65535)) {
    console.log(`Port ${listenPort} is busy, trying ${listenPort + 1} ...`);
    listenPort += 1;
    server.listen(listenPort, "127.0.0.1");
    return;
  }
  console.error("Server error:", err.message);
  process.exit(1);
});

server.on("listening", () => {
  const actual = server.address().port;
  const url = `http://localhost:${actual}`;
  console.log("ELDEN BEAN: BEANREIGN");
  console.log(`Server running at ${url}`);
  console.log("Press Ctrl+C to stop.");
  if (!noOpen) setTimeout(() => openBrowser(url), 400);
});

server.listen(port, "127.0.0.1");
