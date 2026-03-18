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

# create cert
mkdir -p ./certs/created
openssl genrsa -out ./certs/master.key.pem 4096
openssl req -x509 -new -nodes -key ./certs/master.key.pem -sha512 -days 7305 -out ./certs/master.pub.pem -subj "/C=${COUNTRY_TWO_DIGITS}/ST=${LOCATION}/L=${LOCATION}/O=${ORG_NAME}/CN=${CN_NAME}"
