import express from "express";
import cors from "cors";
import authRouter from "./routes/auth.js";
import cookieParser from "cookie-parser";
import { pool } from "./db.js";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const app = express();

if (process.env.NODE_ENV !== "production") {
  app.use(
    cors({
      origin: "http://localhost:5173",
      credentials: true,
    }),
  );
}

app.use(express.json({ limit: "10kb" }));
app.use(cookieParser());

app.get("/health", (_request, response) => {
  response.json({ status: "ok" });
});

app.get("/db-check", async (_request, response) => {
  try {
    const result = await pool.query(
      "SELECT current_database() AS database_name",
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

if (process.env.NODE_ENV === "production") {
  const apiDirectory = dirname(fileURLToPath(import.meta.url));
  const webBuildDirectory = resolve(apiDirectory, "../../web/dist");

  app.use(express.static(webBuildDirectory));

  app.get("/{*splat}", (_request, response) => {
    response.sendFile(join(webBuildDirectory, "index.html"));
  });
}

const port = Number(process.env.PORT ?? "3000");

app.listen(port, "0.0.0.0", () => {
  console.log(`App and API listening on port ${port}`);
});