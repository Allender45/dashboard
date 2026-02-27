require("dotenv").config();

const bcrypt = require("bcryptjs");
const { getDb, DB_PATH } = require("../src/db");

async function main() {
  const [, , login, password] = process.argv;

  if (!login || !password) {
    console.error("Usage: npm --prefix server run create-user -- <login> <password>");
    process.exit(1);
  }

  const db = await getDb();

  const existing = await db.get("SELECT id FROM users WHERE login = ?", [login]);
  if (existing) {
    console.error(`User already exists: ${login}`);
    process.exit(2);
  }

  const hash = await bcrypt.hash(password, 10);
  const r = await db.run("INSERT INTO users (login, password_hash) VALUES (?, ?)", [login, hash]);

  console.log(`Created user id=${r.lastID} login=${login}`);
  console.log(`DB: ${DB_PATH}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
