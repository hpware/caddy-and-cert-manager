#!/bin/bash
# Please change these, if not they will be the default
ORG_NAME="Generic CertManager"
CN_NAME="Generic CertManager"
COUNTRY_TWO_DIGITS="TW"
LOCATION="Taipei"

# prevent unchanged generic values
RAND_TOKEN="$(openssl rand -hex 5)"
if [ "$ORG_NAME" = "Generic CertManager" ]; then
  ORG_NAME="Generic CertManager $RAND_TOKEN"
fi

if [ "$CN_NAME" = "Generic CertManager" ]; then
  CN_NAME="Generic CertManager $RAND_TOKEN"
fi

# guard against overwriting existing CA files
if [ -f "./certs/master.key.pem" ] || [ -f "./certs/master.pub.pem" ]; then
  echo "Error: CA files already exist (master.key.pem and/or master.pub.pem)."
  echo "Refusing to regenerate. To rotate the CA, remove the existing files first."
  exit 1
fi

# create cert
mkdir -p ./certs/created
mkdir -p ./certs/ca_db
openssl genrsa -out ./certs/master.key.pem 4096
openssl req -x509 -new -nodes -key ./certs/master.key.pem -sha512 -days 7305 -out ./certs/master.pub.pem -subj "/C=${COUNTRY_TWO_DIGITS}/ST=${LOCATION}/L=${LOCATION}/O=${ORG_NAME}/CN=${CN_NAME}"

# bootstrap CA database and initial empty CRL
touch ./certs/ca_db/index.txt
echo "01" > ./certs/ca_db/serial
echo "01" > ./certs/ca_db/crlnumber

cat > ./certs/ca_db/openssl.cnf << 'CONF'
[ ca ]
default_ca = CA_default

[ CA_default ]
dir = ./certs/ca_db
database = $dir/index.txt
serial = $dir/serial
crlnumber = $dir/crlnumber
certificate = ./certs/master.pub.pem
private_key = ./certs/master.key.pem
default_md = sha256
default_crl_days = 30
CONF

openssl ca -config ./certs/ca_db/openssl.cnf -gencrl -out ./certs/master.crl.pem -batch
