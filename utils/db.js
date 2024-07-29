const pgData = require('../.env/psql-data.json')
const { Client } = require('pg');

const client = new Client({
    user: pgData.user,
    host: pgData.host,
    port: pgData.port,
    password: pgData.password,
    database: pgData.database
});

async function connectDB() {
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

module.exports = {
    connectDB,
    pgQuery
};