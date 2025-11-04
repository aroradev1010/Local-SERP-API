import "dotenv/config";
import express, { Request, Response } from "express";
import bodyParser from "body-parser";
import cors from "cors";
import mongoose from "mongoose";
import searchRouter from "./routes/search.route";

const app = express();
app.use(bodyParser.json());
app.use(cors());

const PORT = process.env.PORT || 4000;
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/serpdb";

mongoose
  .connect(MONGO_URI)
  .then(() => console.log("Mongo connected"))
  .catch((err) => console.error("Mongo connect err", err));

app.use("/api/search", searchRouter);

app.get("/api/health", (_req: Request, res: Response) =>
  res.json({ status: "ok" })
);

app.listen(PORT, () => console.log(`Server running on ${PORT}`));
