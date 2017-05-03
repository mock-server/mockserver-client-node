#!/usr/bin/env bash

function finish {
  dmesg | grep -E -i -B100 'killed process'
}
trap finish ERR

# install project npm modules

npm cache clear
npm install --no-optional

# run project build

grunt