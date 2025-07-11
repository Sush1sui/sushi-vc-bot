import express from "express";
import "dotenv/config";
import { isBotOnline, startBot } from "./app";

const app = express() as express.Application;
const PORT = process.env.PORT || 3000;

app.use(express.json());

const SERVER_LINK = process.env.SERVER_LINK;

app.get("/", (_req: express.Request, res: express.Response) => {
  res.send("Bot is running");
});

app.listen(PORT, () => console.log(`Listening on port: ${PORT}`));

function pingBot() {
  if (!SERVER_LINK) {
    console.log(
      "SERVER_LINK environment variable not set. Pinging is disabled."
    );
    return;
  }

  fetch(SERVER_LINK)
    .then((res) => {
      if (res.ok) {
        return res.text();
      } else {
        throw new Error(`Ping failed with status: ${res.status}`);
      }
    })
    .then((text) => {
      console.log(`Ping successful: ${text}`);
      if (!isBotOnline) startBot();
    })
    .catch((err) => {
      console.error(`Ping failed: ${err.message}`);
    });
}

export function startServer() {
  pingBot(); // Initial ping
  setInterval(pingBot, 300000); // Ping every 5 minutes
}

process.on("SIGINT", () => {
  console.log("Server shutting down gracefully");
  process.exit(0);
});
