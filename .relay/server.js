const http = require("node:http");
const WebSocket = require("ws");

const DEFAULT_CHANNEL = "miwca";
const channel = normalizeChannel(process.env.TWITCH_CHANNEL || DEFAULT_CHANNEL);
const port = Number(process.env.PORT || 8787);
const messages = [];
const MAX_MESSAGES = 120;
let messageId = 0;
let reconnectTimer;
let stopping = false;
let activeSocket;

function normalizeChannel(value) {
  return String(value).trim().replace(/^#/, "").toLowerCase();
}

function parsePrivmsg(line) {
  const match = line.match(/^(?:@([^ ]+) )?:([^! ]+)!.* PRIVMSG #[^ ]+ :(.*)$/);
  if (!match) return null;

  const tags = {};
  if (match[1]) {
    match[1].split(";").forEach((tag) => {
      const separator = tag.indexOf("=");
      if (separator >= 0) {
        tags[tag.slice(0, separator)] = tag
          .slice(separator + 1)
          .replace(/\\s/g, " ")
          .replace(/\\:/g, ";")
          .replace(/\\\\/g, "\\")
          .replace(/\\r/g, "\r")
          .replace(/\\n/g, "\n");
      }
    });
  }
  const username = tags["display-name"] || match[2];
  const text = match[3].replace(/[\r\n]/g, " ");
  if (!text.trim()) return null;
  return { user: username.slice(0, 24), text: text.slice(0, 220) };
}

function connectChat() {
  if (stopping || !channel) return;
  const socket = new WebSocket("wss://irc-ws.chat.twitch.tv:443");
  activeSocket = socket;
  socket.on("open", () => {
    const nick = `justinfan${Math.floor(Math.random() * 900000 + 100000)}`;
    socket.send("CAP REQ :twitch.tv/tags twitch.tv/commands\r\n");
    socket.send(`NICK ${nick}\r\n`);
    socket.send(`JOIN #${channel}\r\n`);
  });
  socket.on("message", (data) => {
    String(data).split("\r\n").forEach((line) => {
      if (line.startsWith("PING ")) {
        socket.send(`PONG ${line.slice(5)}\r\n`);
        return;
      }
      const parsed = parsePrivmsg(line);
      if (!parsed) return;
      messages.push({ id: ++messageId, ...parsed, at: Date.now() });
      console.log(`[${channel}] ${parsed.user}: ${parsed.text}`);
      if (messages.length > MAX_MESSAGES) messages.shift();
    });
  });
  socket.on("close", scheduleReconnect);
  socket.on("error", () => socket.close());
}

function scheduleReconnect() {
  if (!stopping && !reconnectTimer) {
    reconnectTimer = setTimeout(() => {
      reconnectTimer = null;
      connectChat();
    }, 5000);
  }
}

const server = http.createServer((request, response) => {
  const url = new URL(request.url, "http://localhost");
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.setHeader("Cache-Control", "no-store");
  if (request.method !== "GET") {
    response.writeHead(405).end(JSON.stringify({ error: "GET only" }));
    return;
  }
  if (url.pathname === "/health") {
    response.writeHead(200).end(JSON.stringify({ ok: true, channel: channel || null }));
    return;
  }
  if (url.pathname !== "/chat") {
    response.writeHead(404).end(JSON.stringify({ error: "Not found" }));
    return;
  }
  if (!channel) {
    response.writeHead(503).end(JSON.stringify({ error: "Set TWITCH_CHANNEL", messages: [] }));
    return;
  }

  const before = Number(url.searchParams.get("before"));
  const selected = Number.isFinite(before) && before > 0
    ? messages.filter((message) => message.id < before).slice(-7)
    : messages.slice(-7);
  response.writeHead(200).end(JSON.stringify({ channel, messages: selected }));
});

function start() {
  server.listen(port, "0.0.0.0", () => {
    console.log(`Wrist Chat relay listening on port ${port}; channel=${channel || "not set"}`);
    connectChat();
  });
}

function shutdown() {
  stopping = true;
  clearTimeout(reconnectTimer);
  if (activeSocket) activeSocket.close();
  server.close();
}

if (require.main === module) {
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
  start();
}

module.exports = { DEFAULT_CHANNEL, normalizeChannel, parsePrivmsg, start };
