const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const fs = require('fs-extra');
const simpleGit = require('simple-git');
const net = require('net');


// get the folder path from shell parameter 
//const projectFolder = process.argv[2];
//const downloadFolder = path.join(projectFolder, 'download');

const repoUrl = 'https://github.com/dennis-chilas/p5-project.git';
const localPath = path.join(__dirname, 'project');

// Funktion zum Klonen des Repositories, falls es noch nicht vorhanden ist
const cloneRepo = async () => {
    if (!fs.existsSync(localPath)) {
        console.log('Klonen des Repositories...');
        await simpleGit().clone(repoUrl, localPath);
        console.log('Repository geklont.');
    } else {
        console.log('Repository ist bereits vorhanden.');
    }
};

// Funktion zur Initialisierung und Aktualisierung der Submodule
const updateSubmodules = async () => {
    const git = simpleGit(localPath);
    console.log('Submodule werden initialisiert und aktualisiert...');
    await git.submoduleInit();
    await git.submoduleUpdate(['--recursive']);
    console.log('Submodule initialisiert und aktualisiert.');
};


const projectFolder = process.argv[2] || path.join(__dirname, 'project');
const downloadFolder = path.join(projectFolder, 'download');

// create download folder if necessary
fs.ensureDirSync(projectFolder);
fs.ensureDirSync(downloadFolder);

// initialise simple-git
const git = simpleGit(projectFolder);


const initializeGitRepo = async () => {
    //const git = simpleGit(localPath);
    console.log('Submodule werden initialisiert und aktualisiert...');
    await git.submoduleInit();
    await git.submoduleUpdate(['--recursive']);
    console.log('Submodule initialisiert und aktualisiert.');

    // const isRepo = await git.checkIsRepo();
    // if (!isRepo) {
    //     await git.init();
    //     console.log(`Git-Repository im Ordner ${projectFolder} initialisiert.`);
    // }
    // else console.log("Repo schon da")
};

// attach .gitignore file to exclude download folder 
const gitignorePath = path.join(projectFolder, '.gitignore');
if (!fs.existsSync(gitignorePath)) {
    fs.writeFileSync(gitignorePath, '');
}


if (!fs.readFileSync(gitignorePath, 'utf8').includes('download')) {
    fs.appendFileSync(gitignorePath, '\ndownload\n');
}

// function to create current timestamp for commit message
const getCurrentTimestamp = () => new Date().toISOString();

const app = express();

// middleware to parse json post
app.use(bodyParser.json({ limit: '100mb' }));

// host static files from folder
app.use(express.static(path.resolve(projectFolder)));

// use index.html as standard
app.get('*', (req, res) => {
    res.sendFile(path.resolve(projectFolder, 'index.html'));
});

// route to save canvas image
app.post('/save-canvas', async (req, res) => {
    try {
        const imgData = req.body.image;
        const hash = req.body.hash;
        const gui = req.body.gui;
        const base64Data = imgData.replace(/^data:image\/png;base64,/, '');

        const variablesPath = path.join(projectFolder, 'variables.json');
        fs.writeJson(variablesPath, gui, { spaces: 2 }, (err) => {
            if (err) {
                console.error('Fehler beim Speichern der GUI-Daten:', err);
                res.status(500).json({ success: false, message: 'Fehler beim Speichern der GUI-Daten' });
            } else {
                console.log('GUI-Daten erfolgreich gespeichert');
                //res.status(200).json({ success: true, message: 'Bild und GUI-Daten erfolgreich gespeichert', filePath: filePath });
            }
        });

        // git operations: add, commit and receive commit-hash
        await git.add('./*');
        const commitMessage = getCurrentTimestamp() + "/ hash: "+hash;
        await git.commit(commitMessage);
        const log = await git.log();
        const commitHash = log.latest.hash;

        // create fildname for screenshot using commit hash and timestamp
        const timeStamp = getTimestamp();
        const fileName = `${timeStamp}_${commitHash}_${hash}.png`;
        const filePath = path.join(downloadFolder, fileName);

        // save image in downloads folder
        fs.writeFile(filePath, base64Data, 'base64', (err) => {
            if (err) {
                console.error('Error, cannot save image:', err);
                res.status(500).json({ success: false, message: 'Error, cannot save image.' });
            } else {
                console.log(`Image is saved successfully: ${filePath}`);
                res.status(200).json({ success: true, message: 'Image saved successfully', filePath: filePath });
            }
        });
    } catch (err) {
        console.error('Error during git operations:', err);
        res.status(500).json({ success: false, message: 'Error during git operations' });
    }
});



// function to create current timestamp
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


// function to find free port
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
findFreePort(startPort, async (port) => {
    await cloneRepo();
    await initializeGitRepo();
    app.listen(port, () => {
        console.log(`Project is hosted http://localhost:${port} `);
    });
});