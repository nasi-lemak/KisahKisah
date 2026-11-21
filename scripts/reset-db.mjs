// Deletes the local SQLite database. It is re-created and re-seeded on next start.
import { rmSync } from "node:fs";
import path from "node:path";

const file = process.env.DATABASE_PATH || path.join(process.cwd(), "data", "kisahkisah.db");
for (const suffix of ["", "-wal", "-shm"]) rmSync(file + suffix, { force: true });
console.log(`Removed ${file}. It will be re-seeded on next start.`);
