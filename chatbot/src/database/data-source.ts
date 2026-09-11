import * as dotenv from "dotenv";
import { DataSource } from "typeorm";
import { DoctorsView } from "../entities_view/doctors-view.entity.js";
import { ArticlesView } from "../entities_view/articles-view.entity.js";
import { SpecialtiesView } from "../entities_view/specialties-view.entity.js";

dotenv.config();

const chatbotDbPassword = process.env.CHATBOT_DB_PASSWORD;
if (!chatbotDbPassword || chatbotDbPassword.length < 16) {
  throw new Error(
    "CHATBOT_DB_PASSWORD must be configured with at least 16 characters.",
  );
}

const READ_ONLY_CONNECTION_OPTIONS = {
  options: "-c default_transaction_read_only=on -c statement_timeout=15000",
  // node-postgres has NO connection timeout by default (connectionTimeoutMillis
  // defaults to 0 = wait forever). If the DB host/port/firewall is wrong or
  // unreachable, dataSource.initialize() hangs indefinitely with zero error —
  // initializeWithRetry() never even reaches its 2nd attempt or logs a
  // warning, since attempt 1 simply never resolves or rejects. Bound it so a
  // broken connection fails fast and visibly instead of hanging forever.
  connectionTimeoutMillis: 10_000,
};

export const AppDatasource = new DataSource({
  type: "postgres",
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || "5432"),
  username: "chatbot_readonly",
  password: chatbotDbPassword,
  database: process.env.DB_NAME,
  entities: [DoctorsView, ArticlesView, SpecialtiesView],
  synchronize: false,
  extra: READ_ONLY_CONNECTION_OPTIONS,
});

export const AdminReportDatasource = new DataSource({
  type: "postgres",
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || "5432"),
  username: "chatbot_readonly",
  password: chatbotDbPassword,
  database: process.env.DB_NAME,
  extra: READ_ONLY_CONNECTION_OPTIONS,
});

// On a cold start, backend migrations must create the read-only role and views
// before the chatbot can connect. Retry long enough for the backend to compile,
// start, and finish its migrations instead of crashing the chatbot immediately.
export async function initializeWithRetry(
  dataSource: DataSource,
  retries = 60,
  delayMs = 5000,
): Promise<DataSource> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await dataSource.initialize();
    } catch (error) {
      if (attempt === retries) throw error;
      console.warn(
        `[data-source] initialize() failed (attempt ${attempt}/${retries}); retrying in ${delayMs}ms:`,
        error instanceof Error ? error.message : error,
      );
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
  throw new Error("unreachable");
}
