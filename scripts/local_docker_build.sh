#!/usr/bin/env bash

docker pull jamesdbloom/mockserver:grunt
docker run -v `pwd`:/mockserver -w /mockserver -a stdout -a stderr jamesdbloom/mockserver:grunt /mockserver/scripts/local_quick_build.sh
