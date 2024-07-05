const chokidar = require('chokidar');
const WebSocket = require('ws');

let wss = null;

const startFileWatcher = (folderToWatch, notifyClients) => {
    const watcher = chokidar.watch(folderToWatch, {
        ignored: /(^|[\/\\])\../,
        persistent: true,
        ignoreInitial: true, // Setze ignoreInitial auf true, um das Logging beim Start zu verhindern
        followSymlinks: true,
        depth: 99
    }).on('all', (event, path) => {
        notifyClients("reload")
        console.log(event, path);
      });

 
};

const startWebSocketServer = (port, folderToWatch) => {
    wss = new WebSocket.Server({ port });

    wss.on('connection', (ws) => {
        console.log('Client connected');
        ws.on('message', (message) => {
            console.log(`Received message => ${message}`);
        });

        ws.on('close', () => {
            console.log('Client disconnected');
        });
    });

    startFileWatcher(folderToWatch, notifyClients);

    console.log(`WebSocket server is running on ws://localhost:${port}`);
};

const notifyClients = (message) => {
    if (wss) {
        wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(message);
            }
        });
    }
};

module.exports = {
    startWebSocketServer
};
