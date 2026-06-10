const { query, pool } = require("../src/db");
const { hashPassword } = require("../src/utils/auth");

async function main() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  const fullName = process.env.ADMIN_FULL_NAME || "Admin";

  if (!email || !password) {
    throw new Error("Set ADMIN_EMAIL and ADMIN_PASSWORD before running this script.");
  }

  const passwordHash = await hashPassword(password);
  const { rows } = await query(
    `insert into app_users (email, password_hash, full_name, role)
     values ($1, $2, $3, 'admin')
     on conflict (email) do update
     set password_hash = excluded.password_hash,
         full_name = excluded.full_name,
         role = 'admin',
         is_active = true,
         updated_at = now()
     returning id, email, full_name, role`,
    [email, passwordHash, fullName],
  );

  console.log(`Admin ready: ${rows[0].email}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
