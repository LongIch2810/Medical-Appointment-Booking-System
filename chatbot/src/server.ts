import "dotenv/config";
import express, { type Router } from "express";
import errorHandler from "./middlewares/errorHandler.js";
import { assertInternalServiceKeyConfigured } from "./middlewares/internalServiceAuth.js";

const app = express();
const PORT = process.env.PORT || 5000;

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

async function startServer(): Promise<void> {
  assertInternalServiceKeyConfigured();

  const [{ buildKnowLedgeBase }, { default: initVectorDB }] =
    await Promise.all([
      import("./utils/buildKnowLedgeBase.js"),
      import("./configs/vectordb.js"),
    ]);

  const vectorDbReady =
    process.env.NODE_ENV === "production" ? initVectorDB() : buildKnowLedgeBase();

  // getChatbotRouter() was previously only invoked lazily on the first
  // real "/chatbot/*" request. That import chain pulls in qa_sql.ts /
  // admin_qa_sql.ts, which run a top-level `await initializeWithRetry(...)`
  // opening the read-only Postgres DataSources (up to 60 retries * 5s each
  // — worst case 5 minutes). Deferring that to the first live chat message
  // made every post-deploy/post-restart message pay for it silently (no
  // request-scoped log runs until this import resolves), looking like an
  // unexplained hang. Warm it up here, alongside the vector DB, so Render's
  // own deploy-readiness wait absorbs this cost instead of a user's message.
  const routerReady = getChatbotRouter();

  await Promise.all([vectorDbReady, routerReady]);

  app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
  });
}

console.info("[startup] Chatbot Express app initialized", {
  node: process.version,
});

void startServer().catch((error) => {
  console.error("[startup] Chatbot initialization failed", error);
  process.exitCode = 1;
});
