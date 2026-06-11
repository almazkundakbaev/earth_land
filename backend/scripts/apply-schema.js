const fs = require("fs");
const path = require("path");
const { pool, query } = require("../src/db");

async function main() {
  const schemaPath = path.join(__dirname, "..", "sql", "schema.postgres.sql");
  const sql = fs.readFileSync(schemaPath, "utf8");

  await query(sql);
  console.log("PostgreSQL schema applied.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
