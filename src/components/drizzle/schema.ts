import { relations } from "drizzle-orm";
import {
  pgTable,
  text,
  timestamp,
  boolean,
  index,
  uuid,
} from "drizzle-orm/pg-core";

export const certificates = pgTable("certificates", {
  id: uuid("id").primaryKey().notNull(),
  name: text("name").notNull(),
  privateKey: boolean("private_key").notNull().default(false),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});
