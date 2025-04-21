const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1160,
        height: 800,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js'),
        },
        icon: path.join(__dirname, 'assets/icon.png')
    });

    mainWindow.loadFile('index.html');

    mainWindow.on('closed', function () {
        mainWindow = null;
    });
}

const notesFilePath = path.join(app.getPath('userData'), 'notes.json');

// Fungsi untuk memuat catatan
function loadNotes() {
    if (fs.existsSync(notesFilePath)) {
        const data = fs.readFileSync(notesFilePath, 'utf-8');
        return JSON.parse(data);
    }
    return [];
}

// Fungsi untuk menyimpan catatan
function saveNotes(notes) {
    fs.writeFileSync(notesFilePath, JSON.stringify(notes, null, 2));
}

// Event listener untuk renderer process
ipcMain.handle('load-notes', () => loadNotes());
ipcMain.handle('save-notes', (event, notes) => saveNotes(notes));

app.on('ready', createWindow);

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') app.quit();
});

app.on('activate', function () {
    if (mainWindow === null) createWindow();
});