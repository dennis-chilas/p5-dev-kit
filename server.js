const { setupServer } = require('./modules/serverConfig');
const { findFreePort } = require('./modules/utils');

const startPort = 3000;
findFreePort(startPort, (port) => {
    setupServer().then((app) => {
        app.listen(port, () => {
            console.log(`Project is hosted on http://localhost:${port}`);
        });
    }).catch((err) => {
        console.error('Error setting up the server:', err);
    });
});
