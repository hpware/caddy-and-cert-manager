import { relations } from "drizzle-orm";
import { pgTable, text, timestamp, boolean, index } from "drizzle-orm/pg-core";

export const core_users = pgTable("core_users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export const core_sessions = pgTable(
  "core_sessions",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at").notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => core_users.id, { onDelete: "cascade" }),
  },
  (table) => [index("core_sessions_userId_idx").on(table.userId)],
);

export const core_accounts = pgTable(
  "core_accounts",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => core_users.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("core_accounts_userId_idx").on(table.userId)],
);

export const core_verifications = pgTable(
  "core_verifications",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("core_verifications_identifier_idx").on(table.identifier)],
);

export const jwks = pgTable("jwks", {
  id: text("id").primaryKey(),
  publicKey: text("public_key").notNull(),
  privateKey: text("private_key").notNull(),
  createdAt: timestamp("created_at").notNull(),
  expiresAt: timestamp("expires_at"),
});

export const ssoProvider = pgTable("sso_provider", {
  id: text("id").primaryKey(),
  issuer: text("issuer").notNull(),
  oidcConfig: text("oidc_config"),
  samlConfig: text("saml_config"),
  userId: text("user_id").references(() => core_users.id, {
    onDelete: "cascade",
  }),
  providerId: text("provider_id").notNull().unique(),
  organizationId: text("organization_id"),
  domain: text("domain").notNull(),
});

export const core_usersRelations = relations(core_users, ({ many }) => ({
  core_sessionss: many(core_sessions),
  core_accountss: many(core_accounts),
  ssoProviders: many(ssoProvider),
}));

export const core_sessionsRelations = relations(core_sessions, ({ one }) => ({
  core_users: one(core_users, {
    fields: [core_sessions.userId],
    references: [core_users.id],
  }),
}));

export const core_accountsRelations = relations(core_accounts, ({ one }) => ({
  core_users: one(core_users, {
    fields: [core_accounts.userId],
    references: [core_users.id],
  }),
}));

export const ssoProviderRelations = relations(ssoProvider, ({ one }) => ({
  core_users: one(core_users, {
    fields: [ssoProvider.userId],
    references: [core_users.id],
  }),
}));
