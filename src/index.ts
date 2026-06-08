import { serve } from "bun";
import index from "./index.html";
import { handleApiRequest } from "./server/router.ts";

const server = serve({
  routes: {
    "/api/*": handleApiRequest,
    "/*": index,
  },

  development: process.env.NODE_ENV !== "production" && {
    hmr: true,
    console: true,
  },
});

console.log(`Server running at ${server.url}`);
