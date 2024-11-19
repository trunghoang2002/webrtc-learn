#!/bin/bash

sudo apt update
sudo apt install software-properties-common -y
sudo add-apt-repository ppa:deadsnakes/ppa
sudo apt update
sudo apt install -y python3.10 python3.10-venv python3.10-dev
python3 --version


sudo update-alternatives --install /usr/bin/python3 python3 /usr/bin/python3.8 1
sudo update-alternatives --install /usr/bin/python3 python3 /usr/bin/python3.10 2
sudo update-alternatives --config python3


# curl -sS https://bootstrap.pypa.io/get-pip.py | python3.10
# python3.10 -m pip --version

sudo apt-get install libgomp1 -y
sudo apt-get install ffmpeg -y