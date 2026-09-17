import { pool } from "../../backend/src/db/pool";

// Each test file gets its own module registry in Jest, so this closes the
// pg.Pool instance that this file's own imports created.
afterAll(async () => {
  await pool.end();
});
