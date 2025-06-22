import * as MySqlConnectionPool from './mysql-connection-pool.js';
import { Consumer } from '../../../models/consumer.js';

const _GET_CONSUMER_BY_ID_QUERY = "SELECT c.*, p.name platform FROM consumers c join platforms p on c.platform_id = p.id WHERE c.id = ?";
const _GET_CONSUMER_BY_PLATFORM_AND_PLATFORM_SPECIFIC_ID_QUERY = "SELECT * FROM consumers c join platforms p on c.platform_id = p.id WHERE p.name = ? AND c.platform_specific_id = ?";
const _INCREMENT_CONSUMER_NUM_COMPLETED_BATTLES_QUERY = "UPDATE consumers SET num_completed_battles = num_completed_battles + 1 WHERE id = ?";

export async function getById(consumerId) {
    const connection = await MySqlConnectionPool.connect();
    try {
        const query = _GET_CONSUMER_BY_ID_QUERY;
        const [results] = await connection.query(query, [consumerId]);
        if (results && results.length == 1) {
            return buildConsumer(results[0]);
        }
        else {
            return undefined;
        }
    } catch (err) {
        console.log("Couldn't get consumer.");
        console.log(err);
    }
}
    
export async function getByPlatformAndPlatformSpecificId(platformName, platformSpecificId) {
    const connection = await MySqlConnectionPool.connect();
    try {
        const query = _GET_CONSUMER_BY_PLATFORM_AND_PLATFORM_SPECIFIC_ID_QUERY;
        const [results] = await connection.query(query, [platformName, platformSpecificId]);
        if (results && results.length == 1) {
            return buildConsumer(results[0]);
        }
        else {
            return undefined;
        }
    } catch (err) {
        console.log("Couldn't get consumer.");
        console.log(err);
    }
}

export async function incrementNumCompletedBattles(consumerId) {
    const connection = await MySqlConnectionPool.connect();
    try {
        const query = _INCREMENT_CONSUMER_NUM_COMPLETED_BATTLES_QUERY;
        const [results] = await connection.query(query, [consumerId]);
        if (results.changedRows == 1) {
            return await getById(consumerId);
        }
        else {
            return undefined;
        }
    } catch (err) {
        console.log("Couldn't increment the number of completed battles.");
        console.log(err);
    }
}

function buildConsumer(result) {
    const consumer = new Consumer();
    consumer.id = result.id;
    consumer.platformId = result.platform_id;
    consumer.platformSpecificId = result.platform_specific_id;
    consumer.numCompletedBattles = result.num_completed_battles;
    consumer.platform = result.platform;
    return consumer;
}