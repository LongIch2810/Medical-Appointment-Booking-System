import "dotenv/config";
import express from "express";
import errorHandler from "./middlewares/errorHandler.js";
import { assertInternalServiceKeyConfigured } from "./middlewares/internalServiceAuth.js";

const app = express();
const PORT = process.env.PORT || 5000;

assertInternalServiceKeyConfigured();

const [
  { default: chatRouter },
  { buildKnowLedgeBase },
  { default: initVectorDB },
] = await Promise.all([
  import("./routes/chatbot.route.js"),
  import("./utils/buildKnowLedgeBase.js"),
  import("./configs/vectordb.js"),
]);

app.disable("x-powered-by");
app.use(express.json({ limit: "32kb" }));

app.use("/chatbot", chatRouter);

app.use(errorHandler);

if (process.env.NODE_ENV === "production") {
  await initVectorDB();
} else {
  await buildKnowLedgeBase();
}

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
