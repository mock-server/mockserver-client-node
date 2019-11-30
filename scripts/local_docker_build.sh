#!/usr/bin/env bash

docker pull mockserver/mockserver:grunt
docker run -v `pwd`:/mockserver -w /mockserver -a stdout -a stderr mockserver/mockserver:grunt /mockserver/scripts/local_quick_build.sh
