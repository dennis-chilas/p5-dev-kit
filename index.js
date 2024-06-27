const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const fs = require('fs-extra');
const simpleGit = require('simple-git');
const net = require('net');
const sharp = require('sharp');

const repoUrl = 'https://github.com/dennis-chilas/p5-project.git';
const localPath = path.join(__dirname, 'project');

// Function to clone the repository if it doesn't already exist
const cloneRepo = async () => {
    if (!fs.existsSync(localPath)) {
        console.log('Cloning the repository...');
        await simpleGit().clone(repoUrl, localPath);
        console.log('Repository cloned.');
    } else {
        console.log('Repository already exists.');
    }
};

// Function to initialize and update submodules
const updateSubmodules = async () => {
    const git = simpleGit(localPath);
    try {
        console.log('Initializing submodules...');
        await git.submoduleInit();
        console.log('Submodules initialized.');

        console.log('Updating submodules...');
        await git.submoduleUpdate(['--recursive']);
        console.log('Submodules updated.');
    } catch (error) {
        console.error('Error initializing or updating submodules:', error);
    }
};

// Main function to execute the steps
const main = async () => {
    try {
        await cloneRepo();
        await updateSubmodules();
    } catch (err) {
        console.error('Error loading or initializing the repository or submodules:', err);
    }
};

main().then(() => {
    const projectFolder = process.argv[2] || path.join(__dirname, 'project');
    const downloadFolder = path.join(projectFolder, 'download');

    // Create download folder if necessary
    fs.ensureDirSync(projectFolder);
    fs.ensureDirSync(downloadFolder);

    // Initialize simple-git
    const git = simpleGit(projectFolder);

    const app = express();

    // Middleware to parse JSON posts
    app.use(bodyParser.json({ limit: '100mb' }));

    // // Host static files from folder
    // app.use(express.static(path.resolve(projectFolder)));

    // // Use index.html as standard
    // app.get('*', (req, res) => {
    //     res.sendFile(path.resolve(projectFolder, 'index.html'));
    // });

    app.use((req, res, next) => {
        if (req.path === '/') {
            res.redirect('/project');
        } else {
            next();
        }
    });
        // Serve static files from the project folder
        app.use('/project', express.static(path.resolve(projectFolder)));

        // Serve index.html for the project folder
        app.get('/project/*', (req, res) => {
            res.sendFile(path.resolve(projectFolder, 'index.html'));
        });
       

    // Route to save canvas image
    app.post('/save-canvas', async (req, res) => {
        try {
            const imgData = req.body.image;
            const hash = req.body.hash;
            const gui = req.body.gui;
            const base64Data = imgData.replace(/^data:image\/png;base64,/, '');
            const imgBuffer = Buffer.from(base64Data, 'base64');

            const variablesPath = path.join(projectFolder, 'variables.json');
            fs.writeJson(variablesPath, gui, { spaces: 2 }, (err) => {
                if (err) {
                    console.error('Error saving GUI data:', err);
                    res.status(500).json({ success: false, message: 'Error saving GUI data' });
                } else {
                    console.log('GUI data saved successfully');
                }
            });

            // Git operations: add, commit and receive commit-hash
            await git.add('./*');
            const commitMessage = getCurrentTimestamp() + "/ hash: " + hash;
            await git.commit(commitMessage);
            const log = await git.log();
            const commitHash = log.latest.hash;

            // Create filename for screenshot using commit hash and timestamp
            const timeStamp = getTimestamp();
            const fileName = `${timeStamp}_${commitHash}_${hash}.png`;
            const filePath = path.join(downloadFolder, fileName);

            // Save image in downloads folder
            fs.writeFile(filePath, base64Data, 'base64', (err) => {
                if (err) {
                    console.error('Error, cannot save image:', err);
                    res.status(500).json({ success: false, message: 'Error, cannot save image.' });
                } else {
                    console.log(`Image saved successfully: ${filePath}`);
                    const outputFileName = `${timeStamp}_${commitHash}_${hash}_s.webp`;

                    const outputFilePath = path.join(downloadFolder, outputFileName);
             sharp(imgBuffer)
                .resize({ width: 1000 })
                .toFormat('webp')
                .toFile(outputFilePath);
                    res.status(200).json({ success: true, message: 'Image saved successfully', filePath: filePath });
                }
            });
        } catch (err) {
            console.error('Error during git operations:', err);
            res.status(500).json({ success: false, message: 'Error during git operations' });
        }
    });


       // Route to get a list of all commits
       app.get('/commits', async (req, res) => {
        try {
            const log = await git.log(['--reflog']);
            //--reflog
            console.log(log);
            res.json(log.all);
        } catch (err) {
            console.error('Error fetching commits:', err);
            res.status(500).json({ success: false, message: 'Error fetching commits' });
        }
    });

    // Route to checkout a specific commit
    app.post('/checkout', async (req, res) => {
        const commitHash = req.body.commitHash;
        try {
            await git.checkout(commitHash);
            res.status(200).json({ success: true, message: `Checked out commit ${commitHash}` });
        } catch (err) {
            console.error('Error checking out commit:', err);
            res.status(500).json({ success: false, message: 'Error checking out commit' });
        }
    });

    app.use('/history', express.static(path.resolve(__dirname, 'history/')));

    app.get('/history', (req, res) => {
        res.sendFile(path.resolve(__dirname, 'history/index.html'));
    });
            // Serve index.html for the project folder
    // app.get('/history/*', (req, res) => {
    //     res.sendFile(path.resolve(projectFolder, 'index.html'));
    // });

    // Function to create current timestamp for commit message
    const getCurrentTimestamp = () => new Date().toISOString();

    // Function to create current timestamp
    const getTimestamp = () => {
        const now = new Date();
        const day = String(now.getDate()).padStart(2, '0');
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const year = String(now.getFullYear()).slice(2);
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        return `${year}${month}${day}-${hours}${minutes}${seconds}`;
    };

    // Function to find free port
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

    const startPort = 3000;
    findFreePort(startPort, (port) => {
        app.listen(port, () => {
            console.log(`Project is hosted http://localhost:${port}`);
        });
    });
});
