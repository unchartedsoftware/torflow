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

## Building the Docker container

Prepare the build directory:

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

    sudo docker run -ti --rm --name torflow -v /logs/:/var/log/supervisor/ -p 3000:3000 docker.uncharted.software/torflow

If your container config.js points at a MySQL server that can't be resolved, you can add a hosts entry at run-time using the Docker parameter `--add-host`.

To push the image to the repository:

	sudo docker login docker.uncharted.software
	sudo docker push docker.uncharted.software/torflow

To run on another machine:

	sudo docker pull docker.uncharted.software/torflow
