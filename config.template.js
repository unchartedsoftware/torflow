var config = {
    db : {
        host     : process.env.DB_HOST || 'localhost',
        user     : process.env.DB_USER || 'root',
        password : process.env.DB_PASSWORD || 'admin',
        database : process.env.DB_DATABASE || 'torflow'
    }
};

module.exports = config;