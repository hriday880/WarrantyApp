import { createClient } from "@libsql/client";
import dotenv from "dotenv";

dotenv.config({ path: ".env" });

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function main() {
  try {
    const res = await client.execute("SELECT * FROM User LIMIT 1;");
    console.log(res.columns);
    console.log(res.rows);
  } catch (error) {
    console.error("Error querying database:", error);
  }
}
main();
