FROM centos:centos7

# update and install npm
RUN yum update -y
RUN yum install -y epel-release
RUN yum install -y npm supervisor wget
RUN yum install -y nodejs npm

# java
RUN cd /opt; wget --no-cookies --no-check-certificate --header "Cookie: gpw_e24=http%3A%2F%2Fwww.oracle.com%2F; oraclelicense=accept-securebackup-cookie" "http://download.oracle.com/otn-pub/java/jdk/8u51-b16/jre-8u51-linux-x64.tar.gz" ; tar xvf jre-8*.tar.gz ; alternatives --install /usr/bin/java java /opt/jre1.8*/bin/java 1

# bundle the app source
COPY build /torflow/

# install dependencies
COPY package.json /torflow/
RUN cd /torflow; npm install

# How to run
CMD ["node", "/torflow/bin/ingest", "/torflow/data"]
