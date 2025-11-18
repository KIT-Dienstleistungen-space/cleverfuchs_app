import { Hono } from "hono";
import { trpcServer } from "@hono/trpc-server";
import { cors } from "hono/cors";
import { appRouter } from "./trpc/app-router";
import { createContext } from "./trpc/create-context";

const app = new Hono();

const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",").map((origin: string) =>
  origin.trim()
);

app.use(
  "*",
  cors({
    origin: (origin) => {
      if (!origin || !allowedOrigins || allowedOrigins.length === 0) {
        return origin ?? "*";
      }

      return allowedOrigins.includes(origin) ? origin : allowedOrigins[0];
    },
    allowMethods: ["GET", "POST", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization", "x-api-key"],
    maxAge: 86400,
    credentials: true,
  })
);

const apiToken = process.env.API_AUTH_TOKEN;

if (apiToken) {
  app.use("/api/*", async (c, next) => {
    const headerToken = c.req.header("x-api-key");

    if (headerToken !== apiToken) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    await next();
  });
}

app.use(
  "/api/trpc/*",
  trpcServer({
    endpoint: "/api/trpc",
    router: appRouter,
    createContext,
  })
);

app.get("/", (c) => {
  return c.json({ status: "ok", message: "API is running" });
});

export default app;
