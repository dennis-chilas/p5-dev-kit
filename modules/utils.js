const net = require('net');

const findFreePort = (startPort, callback) => {
    const port = startPort;
    const server = net.createServer();
    server.listen(port, () => {
        server.once('close', () => {
            callback(port);
        });
        server.close();
    });
    server.on('error', () => {
        findFreePort(port + 1, callback);
    });
};

module.exports = {
    findFreePort
};
