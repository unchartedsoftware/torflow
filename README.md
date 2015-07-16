# TorFlow

## Building

Install modules:

    npm install

Build:

    cd public
    gulp install

## Running

Run the server:

	npm start

## Ingest Data

Ingest relays into ElasticSearch:

	curl http://localhost:3000/insertnodes/[relays_indes]
	curl http://localhost:3000/generatebandwidthovertime/[bandwidth_index]/[num_days]

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

## Hit TorFlow

In your browser:

	http://localhost:3000
