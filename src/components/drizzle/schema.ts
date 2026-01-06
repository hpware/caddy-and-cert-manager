import { relations } from "drizzle-orm";
import {
  pgTable,
  text,
  timestamp,
  boolean,
  uuid,
  jsonb,
  integer,
} from "drizzle-orm/pg-core";

export const certificates = pgTable("certificates", {
  id: uuid("id").primaryKey().notNull(),
  name: text("name").notNull(),
  privateKey: boolean("private_key").notNull().default(false),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

export const proxy = pgTable("proxy", {
  id: uuid("id").primaryKey().notNull(),
  publicUrls: jsonb("public_urls").notNull().array().default([]),
  certificateOrigin: text("certificate_origin").notNull(),
  otherSettings: text("other_settings").notNull().default("{}"),
  allowWebsocket: boolean("allow_websocket").notNull().default(false),
  cacheAssets: boolean("cache_assets").notNull().default(false),
  proxyHostUrl: text("proxy_host_url").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

export const kvData = pgTable("kv_data", {
  id: integer("id").generatedAlwaysAsIdentity().notNull().primaryKey(),
  key: text("key").notNull().unique(),
  value: jsonb("value").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});
