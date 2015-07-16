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

In your browser:

	http://localhost:3000

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

Run the container:

    sudo docker run -ti --rm --name torflow -p 3000:3000 -v /vagrant/esdata:/usr/share/elasticsearch-1.7.0/data -v /vagrant/eslogs:/var/log/supervisor docker.uncharted.software:torflow

Ingest the data:

	curl http://localhost:3000/insertnodes/[relays_indes]
	curl http://localhost:3000/generatebandwidthovertime/[bandwidth_index]/[num_days]

The data will be stored in `esdata` and the logs are in `eslogs`.

To push the image to the repository:

	docker login docker.uncharted.software
	docker push docker.uncharted.software:torflow

To run on another machine:

	docker pull docker.uncharted.software:torflow
