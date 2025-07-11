import { startServer } from "./server";
import { startBot } from "./app";
import mongoose from "mongoose";

const uri = process.env.DB_CONNECTION_STRING;
if (!uri) throw new Error("No database connection string");
mongoose
  .connect(uri)
  .then(() => {
    console.log("Connected to DB");
  })
  .catch((e) => console.log(e));

startServer();
