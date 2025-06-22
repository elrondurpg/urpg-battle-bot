import * as MySqlConnectionPool from './mysql-connection-pool.js';

const _GET_PROPERTY_QUERY = "SELECT prop.value FROM consumers c join consumer_properties prop on prop.consumer_id = c.id WHERE c.id = ? AND prop.name = ?";

export async function get(consumerId, propertyName) {
    const connection = await MySqlConnectionPool.connect();
    try {
        const [results] = await connection.query(_GET_PROPERTY_QUERY, [consumerId, propertyName]);
        if (results && results.length == 1) {
            return results[0].value;
        }
        else {
            return undefined;
        }
    } catch (err) {
        console.log("Couldn't get consumer property.");
        console.log(err);
    }
}

