# TorFlow

Data Flow in the Tor Network.

## Building

Requires [node](http://nodejs.org/), [bower](http://bower.io/), and [gulp](http://http://gulpjs.com/).

```bash
npm install
```

Install server-side modules (from $PROJECT_ROOT directory):

```bash
npm install
```

Install client-side modules (from $PROJECT_ROOT/public directory):

```bash
bower install
gulp install
```

## Ingesting Data

Ingest data into MySQL via the bin/ingest node script. There is a set of sample data in the $PROJECT_ROOT/data/sample folder. To import this into your database (from the $PROJECT_ROOT directory):

```bash
node bin/ingest data/sample
```

## Running

Create a config file (from $PROJECT_ROOT directory):

```bash
cp config.template.js config.js
```

Edit config.js to point to your MySQL database.

Start the server (from $PROJECT_ROOT directory):

```bash
npm start
```

The application will be available in your browser at http://localhost:3000/

## Building the Docker Containers

### Prepare the build directory

Start the VM (from $PROJECT_ROOT directory):

```bash
vagrant up
vagrant ssh
cd /vagrant
gulp build
```

You may need to start docker:

```bash
sudo systemctl start docker
```

### Application Server Container

The "torflow" app container will run the application, and connect to an external MySQL database. The "config.js" configuration file build into the container will specify the connection parameters.

Build the app container:

```bash
cd /deploy/app
sudo docker build -t="docker.uncharted.software/torflow" .
```

Run the app container:

```bash
sudo docker run -ti --rm --name torflow -v /logs/:/var/log/supervisor/ -p 3000:3000 docker.uncharted.software/torflow
```

If your container config.js points at a MySQL server that can't be resolved, you can add a hosts entry at run-time using the Docker parameter `--add-host`.

### Ingest Container

The "torflow-ingest" container will run the ingest program described above, ingesting whatever data is mounted at the command-line below.  It will use the "config.js" configuration file built into the container.

Build the ingest container:

```bash
cd /deploy/ingest
sudo docker build -t="docker.uncharted.software/torflow-ingest" .
```

Run the ingest container:

```bash
sudo docker run -ti --rm --name torflow-ingest -v /torflow/data/sample/:/torflow/data docker.uncharted.software/torflow-ingest
```

This assumes you are importing the sample data in the /torflow/data/sample folder. If your container config.js points at a MySQL server that can't be resolved, you can add a hosts entry at run-time using the Docker parameter `--add-host`.

### Demo Container

The demo container is pre-configured to run against the demo MySQL database, and will automatically ingest the the sample data from the /torflow/data/sample folder.  The "config.js" for the demo app, and the "mysql.properties" for the MySQL server, are already configured to match each other. If you change one, you need to update the other.

Run the MySQL container:

```bash
sudo docker run -ti --rm --name torflow-mysql -p 3306:3306 --env-file mysql.properties mysql:5.7
```

Build the demo container:

```bash
cd /deploy/demo
sudo docker build -t="docker.uncharted.software/torflow-demo" .
```

Run the demo container:

```bash
sudo docker run -ti --rm --name torflow --link torflow-mysql:MYSQL -v /logs/:/var/log/supervisor/ -p 3000:3000 docker.uncharted.software/torflow-demo
```
