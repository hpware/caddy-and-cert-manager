import fs from "node:fs";
import { execAsync } from "./exec";
export async function GetAllCurrentCaddySettings() {
  const req = await fetch(`${process.env.CADDY_API_SERVER}/config`);
  const res = await req.json();
  return res;
}

<<<<<<< Updated upstream
=======
async function ensureBaseConfig() {
  const config = await caddyGet("/config/");
  if (!config || !config.apps) {
    await caddyPost("/load", {
      apps: {
        http: {
          servers: {},
        },
        tls: {
          certificates: {
            load_files: [],
          },
          automation: {
            policies: [],
          },
        },
      },
    });
  }

  // Ensure the http servers object exists
  const servers = await caddyGet("/config/apps/http/servers");
  if (!servers) {
    await caddyPut("/config/apps/http/servers", {});
  }

  // Ensure TLS app exists
  const tls = await caddyGet("/config/apps/tls");
  if (!tls) {
    await caddyPut("/config/apps/tls", {
      certificates: { load_files: [] },
      automation: { policies: [] },
    });
  }
}

async function findOrCreateServer(listenPort: number, listenProtocol: string): Promise<string> {
  await ensureBaseConfig();

  // Check if any existing server already listens on this port
  const servers = await caddyGet("/config/apps/http/servers");
  if (servers && typeof servers === "object") {
    for (const [name, server] of Object.entries(servers) as [string, any][]) {
      const listens: string[] = server.listen || [];
      if (listens.some((l: string) => l === `:${listenPort}`)) {
        // Ensure routes array exists
        if (!server.routes) {
          await caddyPut(`/config/apps/http/servers/${name}/routes`, []);
        }
        return name;
      }
    }
  }

  // No existing server on this port — create one
  const serverName = `srv-${listenPort}`;
  await caddyPut(`/config/apps/http/servers/${serverName}`, {
    listen: [`:${listenPort}`],
    routes: [],
    ...(listenProtocol === "https" ? { tls_connection_policies: [{}] } : {}),
  });
  return serverName;
}

// --------------- Route builders ---------------

interface ServiceConfig {
  id: string;
  name: string;
  serviceType: "proxy" | "files";
  publicUrls: string[];
  proxyHostUrl?: string;
  fileServePath?: string;
  allowWebsocket?: boolean;
  cacheAssets?: boolean;
  certificateOrigin: string;
  certificateId?: string | null;
  customCertPath?: string | null;
  customKeyPath?: string | null;
  listenPort: number;
  listenProtocol: string;
}

function buildRoute(config: ServiceConfig): Record<string, unknown> {
  const matchers: Record<string, unknown>[] = [];

  if (config.publicUrls.length > 0) {
    matchers.push({ host: config.publicUrls });
  }

  const handlers: Record<string, unknown>[] = [];

  if (config.serviceType === "proxy" && config.proxyHostUrl) {
    const upstreamUrl = config.proxyHostUrl.startsWith("http")
      ? config.proxyHostUrl
      : `http://${config.proxyHostUrl}`;

    const handler: Record<string, unknown> = {
      handler: "reverse_proxy",
      upstreams: [{ dial: config.proxyHostUrl }],
    };

    if (config.allowWebsocket) {
      handler.transport = {
        protocol: "http",
      };
    }

    handlers.push(handler);
  } else if (config.serviceType === "files" && config.fileServePath) {
    handlers.push({
      handler: "file_server",
      root: config.fileServePath,
    });
  }

  if (config.cacheAssets) {
    handlers.unshift({
      handler: "headers",
      response: {
        set: {
          "Cache-Control": ["public, max-age=3600"],
        },
      },
    });
  }

  const route: Record<string, unknown> = {
    "@id": `service-${config.id}`,
    handle: handlers,
  };

  if (matchers.length > 0) {
    route.match = matchers;
  }

  return route;
}

// --------------- TLS helpers ---------------

function buildTLSLoadFileEntry(
  certPath: string,
  keyPath: string,
  tags: string[],
) {
  return {
    certificate: certPath,
    key: keyPath,
    tags,
  };
}

async function addTLSCertificate(certPath: string, keyPath: string, serviceId: string) {
  const entry = buildTLSLoadFileEntry(certPath, keyPath, [`service-${serviceId}`]);

  // Get current load_files
  let loadFiles = await caddyGet("/config/apps/tls/certificates/load_files");
  if (!loadFiles || !Array.isArray(loadFiles)) {
    await caddyPut("/config/apps/tls/certificates", { load_files: [] });
    loadFiles = [];
  }

  // Append new entry
  await caddyPost("/config/apps/tls/certificates/load_files", entry);
}

async function removeTLSCertificate(serviceId: string) {
  const loadFiles = await caddyGet("/config/apps/tls/certificates/load_files");
  if (!loadFiles || !Array.isArray(loadFiles)) return;

  const tag = `service-${serviceId}`;
  const filtered = loadFiles.filter(
    (entry: { tags?: string[] }) => !entry.tags?.includes(tag),
  );

  await caddyPut("/config/apps/tls/certificates/load_files", filtered);
}

async function disableAutoHTTPS(domains: string[]) {
  if (domains.length === 0) return;

  let policies = await caddyGet("/config/apps/tls/automation/policies");
  if (!policies || !Array.isArray(policies)) {
    await caddyPut("/config/apps/tls/automation", { policies: [] });
    policies = [];
  }

  // Add policy that tells Caddy to skip ACME for these domains
  // (certs are loaded manually via load_files)
  await caddyPost("/config/apps/tls/automation/policies", {
    subjects: domains,
    issuers: [{ module: "internal" }],
  });
}

async function addLetsEncryptPolicy(domains: string[], challenge: "http" | "dns") {
  let policies = await caddyGet("/config/apps/tls/automation/policies");
  if (!policies || !Array.isArray(policies)) {
    await caddyPut("/config/apps/tls/automation", { policies: [] });
    policies = [];
  }

  const policy: Record<string, unknown> = {
    subjects: domains,
    issuers: [
      challenge === "http"
        ? {
            module: "acme",
            challenges: {
              http: { alternate_port: 80 },
            },
          }
        : {
            module: "acme",
            challenges: {
              dns: {
                provider: {
                  name: "cloudflare",
                  api_token: "{env.CF_API_TOKEN}",
                },
              },
            },
          },
    ],
  };

  await caddyPost("/config/apps/tls/automation/policies", policy);
}

async function removeLetsEncryptPolicy(domains: string[]) {
  const policies = await caddyGet("/config/apps/tls/automation/policies");
  if (!policies || !Array.isArray(policies)) return;

  const domainSet = new Set(domains);
  const filtered = policies.filter(
    (policy: { subjects?: string[] }) => {
      if (!policy.subjects) return true;
      return !policy.subjects.some((s: string) => domainSet.has(s));
    },
  );

  await caddyPut("/config/apps/tls/automation/policies", filtered);
}

// --------------- Public API ---------------

>>>>>>> Stashed changes
export async function uploadWebHostFilesToServer(
  file: File,
  fileUUID: string = crypto.randomUUID(),
) {
  const tmpFolder = `/tmp/${fileUUID}/`;
  const srvFolder = `/host/${fileUUID}/`;
  await fs.promises.mkdir(tmpFolder, { recursive: true });
  await fs.promises.writeFile(
    `${tmpFolder}archive.zip`,
    Buffer.from(await file.arrayBuffer()),
  );
  await execAsync(`unzip ${tmpFolder}archive.zip -d ${srvFolder}`);
}

<<<<<<< Updated upstream
export async function AddService() {}
=======
export async function addServiceToCaddy(config: ServiceConfig) {
  const serverName = await findOrCreateServer(config.listenPort, config.listenProtocol);

  // Build and append route
  const route = buildRoute(config);
  await caddyPost(`/config/apps/http/servers/${serverName}/routes`, route);

  // Handle TLS based on certificate origin
  if (config.certificateOrigin === "homecert" && config.customCertPath && config.customKeyPath) {
    await addTLSCertificate(config.customCertPath, config.customKeyPath, config.id);
    await disableAutoHTTPS(config.publicUrls);
  } else if (config.certificateOrigin === "custom" && config.customCertPath && config.customKeyPath) {
    await addTLSCertificate(config.customCertPath, config.customKeyPath, config.id);
    await disableAutoHTTPS(config.publicUrls);
  } else if (config.certificateOrigin === "letsencrypt_http" && config.publicUrls.length > 0) {
    await addLetsEncryptPolicy(config.publicUrls, "http");
  } else if (config.certificateOrigin === "letsencrypt_dns" && config.publicUrls.length > 0) {
    await addLetsEncryptPolicy(config.publicUrls, "dns");
  }
}

export async function removeServiceFromCaddy(serviceId: string) {
  // Remove route by @id
  await caddyDelete(`/id/service-${serviceId}`);

  // Remove TLS certificate entries
  await removeTLSCertificate(serviceId);
}

export async function syncAllServicesToCaddy() {
  const services = await db.select().from(schema.proxy);

  if (services.length === 0) return;

  await ensureBaseConfig();

  for (const service of services) {
    try {
      const config: ServiceConfig = {
        id: service.id,
        name: service.name,
        serviceType: service.serviceType as "proxy" | "files",
        publicUrls: (service.publicUrls as string[]) || [],
        proxyHostUrl: service.proxyHostUrl,
        fileServePath: service.fileServePath || undefined,
        allowWebsocket: service.allowWebsocket,
        cacheAssets: service.cacheAssets,
        certificateOrigin: service.certificateOrigin,
        certificateId: service.certificateId,
        customCertPath: service.customCertPath,
        customKeyPath: service.customKeyPath,
        listenPort: service.listenPort,
        listenProtocol: service.listenProtocol,
      };

      await addServiceToCaddy(config);
    } catch (e) {
      console.error(`Failed to sync service ${service.id} (${service.name}) to Caddy:`, e);
    }
  }
}
>>>>>>> Stashed changes
