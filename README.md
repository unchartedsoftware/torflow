# TorFlow

## Building

Install modules:

    npm install

Build:

    cd public
    gulp

## Running

## Ingest Data

## Using TorFlow

## Building the Docker container

Prepare the build directory:

	cd .
	gulp build

Start the VM:

    vagrant up
    vagrant ssh
    cd /vagrant

You may need to start docker:

	sudo systemctl start docker

Build the container:

    sudo docker build -t="docker.uncharted.software/torflow" .

