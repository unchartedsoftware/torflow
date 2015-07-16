var ElasticSearch = require('elasticsearch');
var Config = require('../config');

var esSpec = {
    host: Config.elasticsearch.host + ':' + Config.elasticsearch.port
    //log: 'trace'
};

var esClient = new ElasticSearch.Client(esSpec);

module.exports = esClient;