FROM centos:centos7

# update and install npm
RUN yum update -y
RUN yum install -y epel-release
RUN yum install -y npm

# bundle the app source
COPY . /src

# Install app dependencies
RUN cd /src; npm install

# Run the server
EXPOSE  8080
CMD ["node", "/src/index.js"]
