import * as dotenv from "dotenv";
import { DataSource } from "typeorm";
import { DoctorsView } from "../entities_view/doctors-view.entity.js";
import { ArticlesView } from "../entities_view/articles-view.entity.js";
import { SpecialtiesView } from "../entities_view/specialties-view.entity.js";

dotenv.config();

export const AppDatasource = new DataSource({
  type: "postgres",
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || "5432"),
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities: [DoctorsView, ArticlesView, SpecialtiesView],
  synchronize: false,
});

export const DataSourceRoot = new DataSource({
  type: "postgres",
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || "5432"),
  username: process.env.DB_ADMIN,
  password: process.env.DB_ADMIN_PASSWORD,
  database: process.env.DB_NAME,
});
