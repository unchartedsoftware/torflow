# TorFlow

## Building

NodeJS and NPM are required for building and running.  Once NPM is installed, install the gulp plugin globally to build the Javascript source:

	npm install -g gulp

Install modules (from root project directory):

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

Ingest relays into ElasticSearch via Logstash.  There is a set of sample data in the $PROJECT_ROOT/data/relays_small folder.  To import this from logstash:

	logstash -f $PROJECT_ROOT$/data/es_import_small.conf
	
NOTE: You must manually edit the configuration file!  It only supports absolute file paths, so the ones checked into source control will be wrong for your local machine

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
