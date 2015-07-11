var ElasticSearch = require('elasticsearch');

var esSpec = {
    host: 'localhost:9200'
    //log: 'trace'
};

var esClient = new ElasticSearch.Client(esSpec);

module.exports = esClient;