import "dotenv/config";
import express, { type Router } from "express";
import errorHandler from "./middlewares/errorHandler.js";
import { assertInternalServiceKeyConfigured } from "./middlewares/internalServiceAuth.js";

const app = express();
const PORT = process.env.PORT || 5000;

type WarmupStatus = "warming" | "ready" | "degraded";

let warmupStatus: WarmupStatus = "warming";

let chatbotRouterPromise: Promise<Router> | undefined;

async function getChatbotRouter(): Promise<Router> {
  chatbotRouterPromise ??= import("./routes/chatbot.route.js").then(
    ({ default: router }) => router,
  );

  try {
    return await chatbotRouterPromise;
  } catch (error) {
    chatbotRouterPromise = undefined;
    throw error;
  }
}

app.disable("x-powered-by");
app.use(express.json({ limit: "32kb" }));

app.get("/", (_req, res) => {
  res.status(200).json({
    success: true,
    service: "medical-appointment-chatbot",
    message: "Chatbot is running",
    health: "/healthy",
  });
});

app.get("/healthy", (_req, res) => {
  res.status(200).json({
    status: "ok",
    service: "medical-appointment-chatbot",
    dependencies: warmupStatus,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

app.use("/chatbot", async (req, res, next) => {
  try {
    const chatRouter = await getChatbotRouter();
    chatRouter(req, res, next);
  } catch (error) {
    next(error);
  }
});

app.use(errorHandler);

export default app;

async function warmUpChatbot(): Promise<void> {
  if (process.env.NODE_ENV !== "production") {
    const { buildKnowLedgeBase } = await import(
      "./utils/buildKnowLedgeBase.js"
    );
    await buildKnowLedgeBase();
  }

  await getChatbotRouter();
}

function startServer(): void {
  assertInternalServiceKeyConfigured();

  app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);

    // Render must see an open port even when Qdrant, Postgres, Redis, or a
    // remote prompt registry is slow. The router import initializes those
    // dependencies, so warm it only after the HTTP server is accepting
    // traffic and expose the progress through /healthy.
    void warmUpChatbot()
      .then(() => {
        warmupStatus = "ready";
        console.info("[startup] Chatbot router warmed up");
      })
      .catch((error) => {
        warmupStatus = "degraded";
        console.error("[startup] Chatbot router warmup failed", error);
      });
  });
}

console.info("[startup] Chatbot Express app initialized", {
  node: process.version,
});

try {
  startServer();
} catch (error) {
  console.error("[startup] Chatbot initialization failed", error);
  process.exitCode = 1;
}
