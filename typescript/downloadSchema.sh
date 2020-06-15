#!/usr/bin/env bash

RELEASE_VERSION="mockserver-5.10.0"

ROOT_DIRECTORY="mockserver"
SCHEMA_DIRECTORY="mockserver-core/src/main/resources/org/mockserver/model/schema"
DESTINATION="mockServer.d.ts"

rm -rf "${ROOT_DIRECTORY}"

mkdir -p "${ROOT_DIRECTORY}"
cp combineSchemas.js $ROOT_DIRECTORY
cd "${ROOT_DIRECTORY}"
git init
git remote add -f origin https://github.com/mock-server/mockserver.git
git config core.sparseCheckout true
echo "${SCHEMA_DIRECTORY}" >> .git/info/sparse-checkout
git checkout ${RELEASE_VERSION}
npm init -y

npm install '@apidevtools/json-schema-ref-parser' 'json-schema-to-typescript'

node combineSchemas "${SCHEMA_DIRECTORY}" "../../${DESTINATION}"

cd ..

rm -rf "${ROOT_DIRECTORY}"
