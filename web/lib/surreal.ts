import { Surreal } from "surrealdb";

let surreal: Surreal | null = null;
let connecting: Promise<Surreal> | null = null;

export async function getSurrealClient(): Promise<Surreal> {
  if (surreal) return surreal;

  if (!connecting) {
    connecting = (async () => {
      const client = new Surreal();
      const dbUrl = process.env.SURREAL_DB_URL || "http://127.0.0.1:8000/rpc";
      const user = process.env.SURREAL_USER || "root";
      const pass = process.env.SURREAL_PASS || "root";
      const ns = process.env.SURREAL_NS || "test";
      const db = process.env.SURREAL_DB || "test";

      try {
        await client.connect(dbUrl);
        await client.signin({ username: user, password: pass });
        await client.use({ namespace: ns, database: db });
        console.log("Connected to SurrealDB successfully");
        surreal = client;
        return client;
      } catch (error) {
        console.error("Failed to connect to SurrealDB:", error);
        connecting = null;
        throw error;
      }
    })();
  }

  return connecting;
}
