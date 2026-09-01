const {createClient} = require("redis");

const client = createClient({
    username: 'default',
    password: process.env.REDIS_PASS,
    socket: {
        host: 'redis-14977.crce263.ap-south-1-1.ec2.cloud.redislabs.com',
        port: 14977,
    }
});

module.exports = client;

