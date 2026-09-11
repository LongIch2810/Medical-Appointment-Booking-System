import "dotenv/config";
import express, { type Router } from "express";
import errorHandler from "./middlewares/errorHandler.js";
import { assertInternalServiceKeyConfigured } from "./middlewares/internalServiceAuth.js";

const app = express();
const PORT = process.env.PORT || 5000;
const isVercel = process.env.VERCEL === "1";

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

if (!isVercel) {
  assertInternalServiceKeyConfigured();

  const [{ buildKnowLedgeBase }, { default: initVectorDB }] =
    await Promise.all([
      import("./utils/buildKnowLedgeBase.js"),
      import("./configs/vectordb.js"),
    ]);

  if (process.env.NODE_ENV === "production") {
    await initVectorDB();
  } else {
    await buildKnowLedgeBase();
  }

  app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
  });
}
