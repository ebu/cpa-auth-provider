module.exports = {
    "development": {
        "host": process.env.DB_HOST,
        "dialect": process.env.DB_TYPE,
        "dialectOptions": process.env.DB_DIALECT_OPTIONS ? JSON.parse(process.env.DB_DIALECT_OPTIONS) : undefined,
        "username": process.env.DB_USER,
        "password": process.env.DB_PASSWORD,
        "database": process.env.DB_DATABASE,
        "port": process.env.DB_PORT,
        "storage": process.env.DB_FILENAME,
        "logging": console.log
    },
    "production": {
        "host": process.env.DB_HOST,
        "dialect": process.env.DB_TYPE,
        "dialectOptions": process.env.DB_DIALECT_OPTIONS ? JSON.parse(process.env.DB_DIALECT_OPTIONS) : undefined,
        "username": process.env.DB_USER,
        "password": process.env.DB_PASSWORD,
        "database": process.env.DB_DATABASE,
        "port": process.env.DB_PORT,
        "storage": process.env.DB_FILENAME,
        "logging": console.log

    }
};
