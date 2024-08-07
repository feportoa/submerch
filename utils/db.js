const { connect_timeout } = require('pg/lib/defaults');
const pgData = require('../.env/psql-data.json')
const { Client } = require('pg');

let client = new Client({
    user: pgData.user,
    host: pgData.host,
    port: pgData.port,
    password: pgData.password,
    database: pgData.database
});

async function pgConnection() {
    client = new Client({
        user: pgData.user,
        host: pgData.host,
        port: pgData.port,
        password: pgData.password,
        database: pgData.database
    });
    try {
        await client.connect();
        console.log("Connected to PostgreSQL");
    } catch (err) {
        console.log("Error connecting to PostgreSQL: ", err);
        throw err;
    }
}

async function pgQuery(sql, params=null) {
    try {
        const res = await client.query(sql, params);
        return res.rows;
    } catch (err) {
        console.error("Error executing query: ", err);
        throw err;
    }
}

async function connectDB() {
    try {
        await pgConnection();
        return;
    } catch (err) {
        console.error("Database connection error: " + err.stack);
        await sleep(5000);
        return connectDB();
    }
}

async function sleep(ms) {
    return new Promise(res => setTimeout(res, ms));
}

module.exports = {
    connectDB,
    pgQuery
};