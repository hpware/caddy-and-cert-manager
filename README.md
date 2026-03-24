# Cert Manager
> [!CAUTION]
> This project is still in development. There will be bugs.

My self-hosted Guest Resources is here: https://certs.default.tw, and the mirror of this repo is here: https://git.yhw.tw/howard/caddy-and-cert-manager

This platform is what I need for my home lab, a place I could get custom long-term certs for my internal services, without the hassle (and security issues) for exposing them to the internet in order to get SSL certs, now you get your own.

## Quick setup!
```bash
curl -O https://raw.githubusercontent.com/hpware/caddy-and-cert-manager/refs/heads/master/docker-compose.yml
curl --output .env https://raw.githubusercontent.com/hpware/caddy-and-cert-manager/refs/heads/master/.env.docker.example
curl -O https://raw.githubusercontent.com/hpware/caddy-and-cert-manager/refs/heads/master/init.sh
```
then, change your env and init.sh to your liking
```bash
chmod +x init.sh
./init.sh
docker compose up -d
```

and you are done! You now can register an account (if you have SSO, login with that!), and you have your own CA, just make sure that you and your family all trust that master certificate!

## Will your master CA private key get leaked if the next Next.js vuln happens?
The CA private key is held by porca, not Next.js, so a Next.js exploit cannot directly extract the key. However, **unauthorized certificate issuance is a serious security incident** — an attacker who can reach porca's signing endpoint can mint trusted certificates for any domain in your CA's scope.

**If you suspect unauthorized issuance:**
1. Audit all issued certificates: review `./certs/ca_db/index.txt` to enumerate every certificate signed by your CA.
2. Immediately revoke any unauthorized certificates via the revoke endpoint and regenerate the CRL.
3. If you cannot fully enumerate what was issued (e.g., logs are missing), rotate the CA: generate a new key pair, re-issue all legitimate certificates, and distribute the new root to your clients.
4. Disable the issuance endpoint (take porca offline or block its port) until the vulnerability is patched.
5. Notify stakeholders who trust your CA so they can take appropriate action.

**Preventing future misuse:** enable logging on porca requests so every signing operation is recorded. Monitor for unexpected certificate issuance. If you use the auto-update CA rotation script, verify your CA's integrity and audit the new CA before distributing it to clients.

## Certificate Management
> [!NOTE]
> This system is still not yet implemented!

This system partly follows [RFC8555](https://datatracker.ietf.org/doc/html/rfc8555), but does not prove ownership of domains. This is designed for home lab users, who want custom certs for their internal services.
