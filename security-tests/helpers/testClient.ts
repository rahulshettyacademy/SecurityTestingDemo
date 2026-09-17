import request from "supertest";
// eslint-disable-next-line import/no-relative-packages
import { createApp } from "../../backend/src/app";
// eslint-disable-next-line import/no-relative-packages
import { pool } from "../../backend/src/db/pool";

// Importing the backend app in-process (rather than hitting a live URL)
// guarantees these tests exercise the code actually checked out on the
// current branch, regardless of whether a Docker image was rebuilt.
export const app = createApp();
export const api = request(app);
export { pool };
