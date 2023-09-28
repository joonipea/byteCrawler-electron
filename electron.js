const path = require("path");

const { app, BrowserWindow } = require("electron");
const isDev = require("electron-is-dev");
const child_process = require("child_process");
const psTree = require("ps-tree");
const find = require("find-process");
let processes = [];

let flagQuit = false;

const surreal = child_process.exec("cd server && npm run surreal");
processes.push(surreal);
surreal.on("exit", function () {
    processes.splice(processes.indexOf(surreal), 1);
});

const server = child_process.exec("cd server && npm run start");
processes.push(server);
server.on("exit", function () {
    processes.splice(processes.indexOf(server), 1);
});

function createWindow() {
    const win = new BrowserWindow({
        width: 800,
        height: 600,
        frame: false,
        webPreferences: { nodeIntegration: true },
    });

    win.loadFile("./frontend/build/index.html");
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
    console.log("window-all-closed");
    console.log(process.platform);
    app.quit();
});

app.on("before-quit", async function (event) {
    if (flagQuit) return;
    event.preventDefault();
    console.log("will-quit");
    await find("port", 9000)
        .then(function (list) {
            if (list[0] != null) {
                process.kill(list[0].pid, "SIGHUP");
            }
        })
        .catch((e) => {
            console.log(e.stack || e);
        });
    await find("port", 7001)
        .then(function (list) {
            if (list[0] != null) {
                process.kill(list[0].pid, "SIGHUP");
            }
        })
        .catch((e) => {
            console.log(e.stack || e);
        });
    flagQuit = true;
    app.quit();
});

app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
