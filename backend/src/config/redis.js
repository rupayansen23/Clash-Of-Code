const {createClient} = require("redis");

const client = createClient({
    username: 'default',
    password: process.env.REDIS_PASS,
    socket: {
        host: 'redis-14648.crce300.ap-south-1-2.ec2.cloud.redislabs.com',
        port: 14648,
        keepAlive: 30000
    }
});

module.exports = client;

