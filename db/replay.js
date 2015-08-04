var connectionPool = require('./connection');
var uuid = require('../util/uuid');



/**
 * Saves a replay to the data base
 * @param name - the name of the replay
 * @param events - the list of events associated with the round
 * @param networkConfiguration - the config for the round being saved
 * @param savedAt - the timestamp when the replay was saved
 * @param summaryInfo - the JSON text for the attack/defense summary information fetched at the end of the round
 * @param onComplete -
 * @param onError
 */
var addReplay = function(name,events,networkConfiguration,summaryInfo,onComplete,onError) {

    var connection = null;

    var error = function(err) {
        connectionPool.close(connection);
        console.error(err);
        if (onError) {
            onError(err);
        } else {
            console.error(err);
        }
    };

    var complete = function(id) {
        connectionPool.close(connection);
        if (onComplete) {
            onComplete(id);
        }
    };

    var getGameLength = function() {
        return Math.ceil(events[events.length-1].data.gametime/1000);
    };


    connectionPool.open(function(conn) {

        connection = conn;

        // Add to 'replay' table
        var id = uuid.generate();
        connection.query('INSERT INTO replays (id,networkConfig,name,lengthinsec,summaryInfo) VALUES (?,?,?,?,?)', [id, JSON.stringify(networkConfiguration), name, getGameLength(),JSON.stringify(summaryInfo)], function (err, rows) {
            if (err) {
                error(err);
            } else {

                var limit = 1000;
                var i = 0;
                var values = [];
                events.forEach(function (event) {
                    var event_id = uuid.generate();
                    var gametime = event.data.gametime;
                    var json = JSON.stringify(event);
                    values.push([event_id, id, json, gametime]);
                });

                connection.query('INSERT INTO events VALUES ?', [values], function (err, rows) {
                    if (err) {
                        error(err);
                    } else {
                        complete(id);
                    }
                });
            }
        });
    });
};

/**
 * Deletes a replay by id
 * @param id - the id of the replay
 */
var deleteReplay = function(id,onComplete,onError) {

    var connection = null;

    var error = function(err) {
        connectionPool.close(connection);
        if (onError) {
            onError(err);
        } else {
            console.error(err);
        }
    };

    var complete = function(id) {
        connectionPool.close(connection);
        if (onComplete) {
            onComplete();
        }
    };


    connectionPool.open(function(conn) {
        connection = conn;
        connection.query('DELETE from replays WHERE id=?', [id], function (err, rows) {
            if (err) {
                error(err);
            } else {
                connection.query('DELETE from events WHERE replay_id=?',[id], function(err,rows) {
                   if (err) {
                       error(err);
                   }  else {
                       complete();
                   }
                });
            }
        });
    });
};

/**
 * Renames a replay
 * @param id - the id of the replay
 * @param newName - the new name for the replay
 */
var renameReplay = function(id,newName,onComplete,onError) {

    var connection = null;

    var error = function(err) {
        connectionPool.close(connection);
        if (onError) {
            onError(err);
        } else {
            console.error(err);
        }
    };

    var complete = function(id) {
        connectionPool.close(connection);
        if (onComplete) {
            onComplete();
        }
    };


    connectionPool.open(function(conn) {
        connection = conn;
        connection.query('UPDATE replays set name=? where id=?', [newName,id], function (err, rows) {
            if (err) {
                error(err);
            } else {
                complete();
            }
        });
    });};

/**
 * Returns a mapping from replay Id to saved name
 */
var getReplayInfo = function(onComplete,onError) {
    var connection = null;

    var complete = function(replays) {
        connectionPool.close(connection);
        onComplete(replays);
    };

    var error = function(err) {
        connectionPool.close(connection);
        if (onError) {
            onError(err);
        } else {
            console.error(err);
        }
    };

    connectionPool.open(function(conn) {
        connection = conn;

        connection.query('SELECT * FROM replays ORDER BY savedat ASC', function(err,rows) {
            if (err) {
                error(err);
            } else {
                var replays = {};
                rows.forEach(function(row) {
                    replays[row.id] = row;
                });
                complete(replays);
            }
        });
    });
};

/**
 * loads a replay by id
 * @param name
 */
var getReplay = function(id,onComplete,onError) {
    var connection = null;

    var complete = function(replay) {
        connectionPool.close(connection);
        onComplete(replay);
    };

    var error = function(err) {
        connectionPool.close(connection);
        console.error(err);
        if (onError) {
            onError(err);
        }
    };

    connectionPool.open(function(conn) {
        connection = conn;

        connection.query('SELECT * FROM events WHERE replay_id=? ORDER BY gametime ASC', [id], function(err,rows) {
            if (err) {
                error(err);
            } else {

                var events = [];

                rows.forEach(function(row) {
                    var eventObject = JSON.parse(row.json);

                    events.push({
                        gametime : row.gametime,
                        data : eventObject.data,
                        topic : eventObject.topic
                    });
                });

                connection.query('SELECT networkConfig,summaryInfo from replays where id=?', [id], function(err,rows) {
                    if (err || !rows || rows.length === 0) {
                        error(err || 'Replay not found');
                    } else {
                        complete({
                            summaryInfo : rows[0].summaryInfo ? rows[0].summaryInfo : '{}',
                            networkConfiguration : rows[0].networkConfig,
                            events : events
                        });
                    }
                })

            }
        });
    });};


module.exports.add = addReplay;
module.exports.delete = deleteReplay;
module.exports.rename = renameReplay;
module.exports.getAllInfo = getReplayInfo;
module.exports.getReplay = getReplay;