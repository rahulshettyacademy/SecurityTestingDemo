import { createApp } from "./app";
import { env } from "./config/env";

const app = createApp();

// Bound to 0.0.0.0 only inside the Docker network; Docker Compose publishes
// this port to the host as 127.0.0.1 only (see docker-compose.yml).
app.listen(env.port, () => {
  console.log(`RSA SecureShop backend listening on port ${env.port} (${env.nodeEnv})`);
});
