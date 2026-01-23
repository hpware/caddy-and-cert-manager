/**
 * {
   "-DvSGUm363U": "https://community.letsencrypt.org/t/adding-random-entries-to-the-directory/33417", // I will not be adding this
   "meta": {
     "caaIdentities": [
       "letsencrypt.org" // getting from user
     ],
     "profiles": {
       "classic": "https://letsencrypt.org/docs/profiles#classic", // prob go to docs?
       "shortlived": "https://letsencrypt.org/docs/profiles#shortlived",
       "tlsclient": "https://letsencrypt.org/docs/profiles#tlsclient",
       "tlsserver": "https://letsencrypt.org/docs/profiles#tlsserver"
     },
     "termsOfService": "https://letsencrypt.org/documents/LE-SA-v1.6-August-18-2025.pdf",
     "website": "https://letsencrypt.org"
   },
   "newAccount": "https://acme-v02.api.letsencrypt.org/acme/new-acct",
   "newNonce": "https://acme-v02.api.letsencrypt.org/acme/new-nonce",
   "newOrder": "https://acme-v02.api.letsencrypt.org/acme/new-order",
   "renewalInfo": "https://acme-v02.api.letsencrypt.org/acme/renewal-info",
   "keyChange": "https://acme-v02.api.letsencrypt.org/acme/key-change",
   "revokeCert": "https://acme-v02.api.letsencrypt.org/acme/revoke-cert"
 }
 */
//https://datatracker.ietf.org/doc/html/rfc8555#section-7.1.1
import { NextRequest } from "next/server";

export const GET = async (req: NextRequest) => {
  const serverHost = process.env.NEXT_PUBLIC_URL!;
  const caaIdentity = process.env.CAA_IDENTITY!;
  const meta = {
    caaIdentities: [caaIdentity],
    profiles: {
      classic: "https://caddy-and-cert-manager.docs.yhw.tw/profiles/classic",
      shortlived:
        "https://caddy-and-cert-manager.docs.yhw.tw/profiles/shortlived",
      tlsserver:
        "https://caddy-and-cert-manager.docs.yhw.tw/profiles/tlsserver",
    },
    termsOfService: `https://caddy-and-cert-manager.docs.yhw.tw/code/license`,
    website: "https://caddy-and-cert-manager.docs.yhw.tw/",
    externalAccountRequired: false,
  };
  return Response.json({
    serverHost,
    meta,
    newAccount: `${serverHost}/api/cert/acme/new-acct`,
    newNonce: `${serverHost}/api/cert/acme/new-nonce`,
    newOrder: `${serverHost}/api/cert/acme/new-order`,
    revokeCert: `${serverHost}/api/cert/acme/revoke-cert`,
    renewalInfo: `${serverHost}/api/cert/acme/renewal-info`,
    keyChange: `${serverHost}/api/cert/acme/key-change`,
  });
};
