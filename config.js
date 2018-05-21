var config = {
    db : {
        host     : process.env.DB_HOST || 'localhost',
        user     : process.env.DB_USER || 'torflow',
        password : process.env.DB_PASSWORD || 'torflow',
        database : process.env.DB_DATABASE || 'torflow'
    }
};

module.exports = config;