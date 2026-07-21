import postgres from "postgres";

const connStrings = [
  "postgresql://postgres@localhost:5432/odhvica",
  "postgresql://postgres@localhost:5432/odhvica_dev",
  "postgresql://postgres:admin@localhost:5432/odhvica",
  "postgresql://postgres:admin@localhost:5432/odhvica_dev",
  "postgresql://postgres:password@localhost:5432/odhvica",
  "postgresql://postgres:password@localhost:5432/odhvica_dev",
  "postgresql://odhvica:odhvica@localhost:5432/odhvica",
  "postgresql://postgres:123456@localhost:5432/odhvica",
  "postgresql://postgres:123456@localhost:5432/odhvica_dev",
  "postgresql://postgres:root@localhost:5432/odhvica",
  "postgresql://postgres:root@localhost:5432/odhvica_dev",
];

async function test() {
  for (const conn of connStrings) {
    console.log(`Testing: ${conn.replace(/:[^@]+@/, ":****@")}`);
    try {
      const client = postgres(conn, { idle_timeout: 2, connect_timeout: 2 });
      const res = await client`SELECT 1 as val`;
      console.log(`✅ Success! Working connection string: ${conn}`);
      await client.end();
      return conn;
    } catch (err: any) {
      console.log(`❌ Fail: ${err.message}`);
    }
  }
  process.exit(1);
}

test();
