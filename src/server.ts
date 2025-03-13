import express from "express";
import "dotenv/config";

const app = express() as express.Application;
const PORT = process.env.PORT || 3000;

app.use(express.json());

const SERVER_LINK = process.env.SERVER_LINK;
let timeoutId: NodeJS.Timeout;

app.get("/", (_req: express.Request, res: express.Response) => {
  res.send("Bot is running");
});

app.listen(PORT, () => console.log(`Listening on port: ${PORT}`));

function pingBot() {
  if (!SERVER_LINK) return;

  const attemptPing = () => {
    fetch(SERVER_LINK)
      .then((res) => res.text())
      .then((text) => console.log(`Ping successful: ${text}`))
      .catch((err) => {
        clearTimeout(timeoutId);
        console.log(`Ping failed, retrying: ${err}`);
        timeoutId = setTimeout(attemptPing, 5000);
      });
  };

  attemptPing(); // Start the ping loop immediately
}

export const startServer = () => setInterval(pingBot, 600000);

process.on("SIGINT", () => {
  console.log("Server shutting down gracefully");
  process.exit(0);
});
