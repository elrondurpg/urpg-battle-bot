import * as mysql from 'mysql2/promise';

var _connection = undefined;

export async function connect() {
    if (_connection) {
        return _connection;
    }
    else {
        return await tryConnect();
    }
}

async function tryConnect() {
    try {
        _connection = await mysql.createPool({
            host: process.env.BATTLE_STORE_HOST,
            user: process.env.BATTLE_STORE_USER,
            password: process.env.BATTLE_STORE_PASSWORD,
            database: process.env.BATTLE_STORE_DATABASE,
            supportBigNumbers: true,
            bigNumberStrings: true,
            charset: 'utf8mb4'
        });
        return _connection;
    } catch (err) {
        console.log("Couldn't connect to database.");
        console.log(err);
        _connection = undefined;
    }
}