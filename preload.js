const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("notesAPI", {
    loadNotes: () => ipcRenderer.invoke("load-notes"),
    saveNotes: (notes) => ipcRenderer.invoke("save-notes", notes),
});
