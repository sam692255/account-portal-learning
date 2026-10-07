import "dotenv/config";
import { Pool } from "pg";

function getEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

const port = Number(getEnv("DB_PORT"));

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error("DB_PORT must be a valid port number.");
}

export const pool = new Pool({
  host: getEnv("DB_HOST"),
  port,
  database: getEnv("DB_NAME"),
  user: getEnv("DB_USER"),
  password: getEnv("DB_PASSWORD"),
  ssl: process.env.DB_SSL === "true" ? {} : false,
});