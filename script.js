const { ipcRenderer } = require('electron');
const fs = require('fs');
const path = require('path');

const notesFilePath = path.join(__dirname, 'notes.json');

// // ** Fungsi untuk menyesuaikan tinggi textarea **
// function adjustTextareaHeight(textarea) {
//     textarea.style.height = "auto";
//     textarea.style.height = (textarea.scrollHeight) + "px";
// }

// ** Fungsi untuk memuat catatan dari file **
function loadNotes() {
    if (fs.existsSync(notesFilePath)) {
        const data = fs.readFileSync(notesFilePath, 'utf-8');
        return JSON.parse(data);
    }
    return [];
}

// ** Fungsi untuk menyimpan catatan ke file **
function saveNotes(notes) {
    fs.writeFileSync(notesFilePath, JSON.stringify(notes, null, 2));
}

// ** Fungsi untuk menampilkan catatan **
function renderNotes() {
    const notesList = document.getElementById('notes-list');
    notesList.innerHTML = '';
    const notes = loadNotes();

    notes.forEach((note) => {
        const noteElement = document.createElement('div');
        noteElement.className = 'note-item';
        noteElement.innerHTML = `
            <h3>${note.title}</h3>
            <div class="note-content">${note.content.replace(/\n/g, '<br>')}</div>
            <div class="actions">
                <button class="edit" onclick="editNote('${note.id}')">Tingal</button>
                <button class="delete" onclick="deleteNote('${note.id}')">Hapus</button>
            </div>
        `;
        notesList.appendChild(noteElement);
    });
}

// ** Fungsi untuk mencari catatan **
function searchNotes() {
    const query = document.getElementById("search-note").value.toLowerCase();
    const notesList = document.getElementById("notes-list");
    const clearBtn = document.getElementById("clear-search");
    
    // Tampilkan tombol "X" jika ada input
    if (query.length > 0) {
        clearBtn.style.display = "block";
    } else {
        clearBtn.style.display = "none";
    }

    notesList.innerHTML = '';
    const notes = loadNotes();
    const filteredNotes = notes.filter(note =>
        note.title.toLowerCase().includes(query) || note.content.toLowerCase().includes(query)
    );

    filteredNotes.forEach((note) => {
        const noteElement = document.createElement('div');
        noteElement.className = 'note-item';
        noteElement.innerHTML = `
            <h3>${note.title}</h3>
            <div class="note-content">${note.content.replace(/\n/g, '<br>')}</div>
            <div class="actions">
                <button class="edit" onclick="editNote('${note.id}')">Tingal</button>
                <button class="delete" onclick="deleteNote('${note.id}')">Hapus</button>
            </div>
        `;
        notesList.appendChild(noteElement);
    });
}

// Fungsi untuk menghapus pencarian
function clearSearch() {
    document.getElementById("search-note").value = "";
    document.getElementById("clear-search").style.display = "none";
    searchNotes(); // Render ulang daftar catatan
}

// ** Fungsi untuk menambahkan atau mengedit catatan **
document.getElementById('add-note').addEventListener('click', () => {
    let title = document.getElementById('note-title').value.trim();
    const content = document.getElementById('note-content').value.trim();
    const editId = document.getElementById('add-note').getAttribute('data-edit-id');

    if (!title) {
        title = "Jejerna teu acan";
    }

    if (content) {
        const notes = loadNotes();

        if (editId) {
            // Konfirmasi sebelum menyimpan perubahan
            showConfirmPopup("Yakin ingin menyimpan catatan yang sudah diubah?", () => {
                const noteIndex = notes.findIndex(note => note.id === editId);
                if (noteIndex !== -1) {
                    notes[noteIndex].title = title;
                    notes[noteIndex].content = content;
                    saveNotes(notes);
                    renderNotes();
                    resetForm();
                }
            });
        } else {
            // Tambah catatan baru
            const newNote = {
                id: Date.now().toString(),
                title,
                content
            };
            notes.push(newNote);
            saveNotes(notes);
            renderNotes();
            resetForm();
        }

    }
});
// Fungsi untuk mereset form setelah menyimpan
function resetForm() {
    document.getElementById('note-title').value = '';
    document.getElementById('note-content').value = '';
    document.getElementById('add-note').removeAttribute('data-edit-id');
    document.getElementById('add-note').textContent = "Tambih Catatan";
    document.getElementById('cancel-edit').style.display = "none"; // Sembunyikan tombol batal
}

// ** Fungsi untuk mengedit catatan **
window.editNote = (id) => {
    const notes = loadNotes();
    const noteToEdit = notes.find(note => note.id === id);
    
    if (noteToEdit) {
        document.getElementById('note-title').value = noteToEdit.title;
        document.getElementById('note-content').value = noteToEdit.content;

        // Simpan ID catatan yang sedang diedit
        document.getElementById('add-note').setAttribute('data-edit-id', id);
        document.getElementById('add-note').textContent = "Robih Catatan";
        document.getElementById('cancel-edit').style.display = "inline-block"; // Tampilkan tombol batal
    }
};

// Fungsi untuk membatalkan edit dengan konfirmasi jika ada perubahan
window.cancelEdit = () => {
    const currentTitle = document.getElementById('note-title').value;
    const currentContent = document.getElementById('note-content').value;

    if (currentTitle.trim() !== "" || currentContent.trim() !== "") {
        const confirmCancel = showConfirmPopup("Yakin bade batalkeun?", ()=>{
            // Reset input form
            resetForm();
        });
        if (!confirmCancel) {
            return;
        }
    }

    
};

// ** Fungsi untuk menghapus catatan **
window.deleteNote = (id) => {
    showConfirmPopup("Yakin bade hapus catetan ieu?", () => {
        const notes = loadNotes();
        const updatedNotes = notes.filter(note => note.id !== id);
        saveNotes(updatedNotes);
        renderNotes();
    });
};

// ** Load catatan saat aplikasi dibuka **
document.addEventListener("DOMContentLoaded", () => {
    renderNotes();
    adjustTextareaHeight(document.getElementById("note-content"));
});


function showConfirmPopup(message, onConfirm) {
    document.getElementById("popupMessage").innerText = message;
    document.getElementById("confirmPopup").classList.add("show");

    // Hapus event listener lama agar tidak bertumpuk
    const confirmButton = document.getElementById("confirmAction");
    confirmButton.replaceWith(confirmButton.cloneNode(true)); // Reset tombol
    document.getElementById("confirmAction").addEventListener("click", function() {
        onConfirm(); // Panggil fungsi yang diberikan
        closeConfirmPopup();
    });

    document.getElementById("cancelAction").addEventListener("click", closeConfirmPopup);
}

function closeConfirmPopup() {
    document.getElementById("confirmPopup").classList.remove("show");
}
