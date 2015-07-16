FROM centos:centos7

# update and install npm
RUN yum update -y
RUN yum install -y epel-release
RUN yum install -y npm

# Run the server
WORKDIR /src
EXPOSE  8080
CMD ["npm", "start"]

# bundle the app source
COPY . /src

# Install app dependencies
RUN cd /src; npm install
