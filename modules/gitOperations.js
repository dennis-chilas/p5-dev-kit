const simpleGit = require('simple-git');
const path = require('path');
const fs = require('fs-extra');
const repoUrl = 'https://github.com/dennis-chilas/p5-project.git';
const localPath = path.join(__dirname, '..', 'project');

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

module.exports = {
    cloneRepo,
    updateSubmodules,
    getGitInstance: () => simpleGit(localPath)
};
