# P5.js Dev Kit

This is an environment to develop p5.js projects. The main feature is to handle screenshots from a p5.js script. Therefore it's heavily inspired by code-canvas from Matt DesLaurier, the screenshots are located in the project folder, where they are tracked by git and named after their git commit hash. The server has a visual tool built in to listing all commits and display the according screenshots in a discrete webview. In the boilerplate p5.js project is the functionality of hash seeds and a gui library (dat.gui) integrated. The hash seeds are also saved in the git commit and in the screenshot filename. 

I use this starter kit for teaching classes, therefore the code organisation is just basic, hopefully understandable for beginners.


## requirements
node.js needs to be installed. e.g. for MacOS, install homebrew (www.homebrew.sh) then

```
brew install node
```


## install
To install the environment download zip and unpack or clone the repository.

Install all dependencies:

```
npm install
```


## starting
The p5.js template is loaded as a submodule automatically to project/ - in this folder is the source code and a download folder. All screenshots/image exports are saved in project/download/


```
node server.js
```
