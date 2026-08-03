import { createClient } from "@libsql/client";
import dotenv from "dotenv";

dotenv.config({ path: ".env" });

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function main() {
  try {
    console.log("Checking columns in User table...");
    const res = await client.execute("PRAGMA table_info(User)");
    const hasIsBanned = res.rows.some(row => row.name === "isBanned");
    
    if (!hasIsBanned) {
      console.log("Adding isBanned column to Turso database...");
      await client.execute("ALTER TABLE User ADD COLUMN isBanned BOOLEAN NOT NULL DEFAULT 0;");
      console.log("Column added successfully!");
    } else {
      console.log("isBanned column already exists.");
    }
  } catch (error) {
    console.error("Error updating database:", error);
  }
}
main();
