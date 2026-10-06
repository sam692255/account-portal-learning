import express from "express";
import cors from "cors";
import authRouter from "./routes/auth.js";
import cookieParser from "cookie-parser";
import { pool } from "./db.js";

const app = express();
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  }),
);
app.use(express.json({ limit: "10kb" }));
app.use(cookieParser());
const port = 3000;

app.get("/health", (_request, response) => {
  response.json({ status: "ok" });
});

app.get("/db-check", async (_request, response) => {
  try {
    const result = await pool.query(
      "SELECT current_database() AS database_name"
    );

    const databaseName = result.rows[0]?.database_name;

    if (!databaseName) {
      throw new Error("Database query returned no result.");
    }

    response.json({ connected: true, database: databaseName });
  } catch (error) {
    console.error("Database connection failed:", error);
    response.status(500).json({ connected: false });
  }
});
app.use("/auth", authRouter);
app.listen(port, () => {
  console.log(`API listening at http://localhost:${port}`);
});