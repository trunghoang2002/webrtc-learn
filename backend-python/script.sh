#!/bin/bash

apt update
apt install software-properties-common -y
add-apt-repository ppa:deadsnakes/ppa
apt update
apt install -y python3.10 python3.10-venv python3.10-dev
python3 --version


update-alternatives --install /usr/bin/python3 python3 /usr/bin/python3.8 1
update-alternatives --install /usr/bin/python3 python3 /usr/bin/python3.10 2
update-alternatives --config python3


# curl -sS https://bootstrap.pypa.io/get-pip.py | python3.10
# python3.10 -m pip --version

apt-get install libgomp1 -y
apt-get install ffmpeg -y