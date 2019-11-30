#!/usr/bin/env bash

docker pull mockserver/mockserver:grunt
docker run -i -t --memory=4096m --oom-kill-disable -v `pwd`:/mockserver -w /mockserver -a stdout -a stderr mockserver/mockserver:grunt /bin/bash
