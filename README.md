# Cert Manager
> [!CAUTION]
> This project is still in development. There will be bugs.

My self hosted Guest Resources is here: https://certs.default.tw

This platform is what I need for my home lab, a place I could get custom long term certs for my internal services, without the hassle (and security issues) for exposing them to the internet in order to get SSL certs, now you get your own.

## Quick setup!
```bash
curl -O https://raw.githubusercontent.com/hpware/caddy-and-cert-manager/refs/heads/master/docker-compose.yml
curl --output .env https://raw.githubusercontent.com/hpware/caddy-and-cert-manager/refs/heads/master/.env.docker
curl -O https://raw.githubusercontent.com/hpware/caddy-and-cert-manager/refs/heads/master/init.sh
```
then, change your env and init.sh to your liking
```bash
chmod +x init.sh
./init.sh
docker compose up -d
```

and you are done! You now can register an account (if you have SSO, login with that!), and you have your own CA, just make sure that you and your family all trust that master certificate!

## Will the master CA get leaked?
If you have properly secured your server, no it won't this system (porca) is designed to only let the Next.js application request to sign a CSR request, revoking a certificate, and get a CRL only.

## Certificate Management
> [!NOTE]
> This system is still not yet implemented!

This system partly follows [RFC8555](https://datatracker.ietf.org/doc/html/rfc8555), but does not prove ownership of domains. This is designed for home lab users, who want custom certs for their internal services.
