# TorFlow

## Building

NodeJS and NPM are required for building and running. Once NPM is installed, install the gulp and bower plugins globally to build the Javascript source:

	npm install -g gulp bower

Install modules (from root project directory):

    npm install

To connect to the data, copy the config.template.js file to config.js and enter your database credentials in there.

Build:

    cd public
	bower install
    gulp install

## Running

Create a config file:

	cp config.template.js config.js

Edit config.js to point to your MySQL database.

Run the server:

	npm start

In your browser:

	http://localhost:3000

## Ingest Data

Ingest data into MySQL via the bin/ingest node script.  There is a set of sample data in the $PROJECT_ROOT/data/sample folder.  To import this into your database (from the root project directory):

	node bin/ingest data/sample

# Building the Docker containers

## Prepare the build directory

Prepare the build directory:

	gulp build

Start the VM:

    vagrant up
    vagrant ssh
    cd /vagrant

You may need to start docker:

	sudo systemctl start docker

### Application server container

The "torflow" app container will run the application, and connect to an external MySQL database.  The "config.js" configuration file build into the container will specify the connection parameters.

Build the app container:

    cd /deploy/app
    sudo docker build -t="docker.uncharted.software/torflow" .

Run the app container:

    sudo docker run -ti --rm --name torflow -v /logs/:/var/log/supervisor/ -p 3000:3000 docker.uncharted.software/torflow

If your container config.js points at a MySQL server that can't be resolved, you can add a hosts entry at run-time using the Docker parameter `--add-host`.

### Ingest container

The "torflow-ingest" container will run the ingest program described above, ingesting whatever data is mounted at the command-line below.  It will use the "config.js" configuration file built into the container.

Build the ingest container:

    cd /deploy/ingest
    sudo docker build -t="docker.uncharted.software/torflow-ingest" .

Run the ingest container:

    sudo docker run -ti --rm --name torflow-ingest -v /torflow/data/sample/:/torflow/data docker.uncharted.software/torflow-ingest

This assumes you are importing the sample data in the /torflow/data/sample folder. If your container config.js points at a MySQL server that can't be resolved, you can add a hosts entry at run-time using the Docker parameter `--add-host`.

### Demo container

The demo container is pre-configured to run against the demo MySQL database, and will automatically ingest the the sample data from the /torflow/data/sample folder.  The "config.js" for the demo app, and the "mysql.properties" for the MySQL server, are already configured to match each other. If you change one, you need to update the other.

Run the MySQL container:

    sudo docker run -ti --rm --name torflow-mysql -p 3306:3306 --env-file mysql.properties mysql:5.7

Build the demo container:

    cd /deploy/demo
    sudo docker build -t="docker.uncharted.software/torflow-demo" .

Run the demo container:

    sudo docker run -ti --rm --name torflow --link torflow-mysql:MYSQL -v /logs/:/var/log/supervisor/ -p 3000:3000 docker.uncharted.software/torflow-demo

### Known issues with Docker

The Docker containers run in UTC, but the app currently assumes you are running in EDT.  To workaround this, force the time zone of the Docker container to EDT. For example, add this to the docker run command:

	-v /usr/share/zoneinfo/Canada/Eastern:/etc/localtime

