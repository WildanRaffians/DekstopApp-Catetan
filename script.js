let isEditing = false; // Status untuk melacak apakah ada catatan yang sedang diubah
let currentNoteId = null; // ID catatan yang sedang diedit
async function loadNotes() {
    return await window.notesAPI.loadNotes();
}

async function saveNotes(notes) {
    await window.notesAPI.saveNotes(notes);
}


// ** Fungsi untuk menampilkan catatan **
async function renderNotes() {
    const notesList = document.getElementById('notes-list');
    notesList.innerHTML = '';
    const notes = await loadNotes();

    notes.forEach((note) => {
        const noteElement = document.createElement('div');
        noteElement.className = 'note-item';
        noteElement.innerHTML = `
            <div class="row justify-between">
                <h3>${note.title}</h3>
                <div style="width: 20px;"></div>
                <div class="tooltip-container">
                    <span class="tooltip">Ditambih :${formatDate(note.createdAt)}<br>
                    Terakhir Dirobih : ${formatDate(note.updatedAt)}</span>
                    <span class="texttip">i</span>
                </div>
            </div>
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
async function searchNotes() {
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
    const notes = await loadNotes();
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
document.getElementById('add-note').addEventListener('click',async () => {
    let title = document.getElementById('note-title').value.trim();
    const content = document.getElementById('note-content').value.trim();
    const editId = document.getElementById('add-note').getAttribute('data-edit-id');

    if (!title) {
        title = "Jejerna teu acan";
    }

    if (content) {
        const notes = await loadNotes();
        const now = new Date().toISOString(); // Tanggal dan waktu saat ini


        if (editId) {
            // Konfirmasi sebelum menyimpan perubahan
            if (title !== initialTitle.trim() || content !== initialContent.trim()) {
                showConfirmPopup("Yakin bade nyimpen catetan nu tos dirobih?", async () => {
                    const noteIndex = notes.findIndex(note => note.id === editId);
                    if (noteIndex !== -1) {
                        notes[noteIndex].title = title;
                        notes[noteIndex].content = content;
                        notes[noteIndex].updatedAt = now;
                        await saveNotes(notes);
                        // Set status editing ke false
                        isEditing = false;
                        currentNoteId = null;
                        renderNotes();
                        resetForm();
                    }
                });
            } else{
                // Set status editing ke false
                isEditing = false;
                currentNoteId = null;
                renderNotes();
                resetForm();
            }
        } else {
            // Tambah catatan baru
            const newNote = {
                id: Date.now().toString(),
                title,
                content,
                createdAt: now, // Tanggal dibuat
                updatedAt: now // Tanggal terakhir diedit
            };
            notes.push(newNote);
            await saveNotes(notes);
            // Set status editing ke false
            isEditing = false;
            currentNoteId = null;
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
window.editNote = async (id)  => {
    if (isEditing) {
        showAlertPopup("Aya catetan nu keur ditingal, batalkeun atawa simpen heula.");
        return;
    }
    const notes = await loadNotes();
    const noteToEdit = notes.find(note => note.id === id);
    
    if (noteToEdit) {
        document.getElementById('note-title').value = noteToEdit.title;
        document.getElementById('note-content').value = noteToEdit.content;
        saveInitialValues();

        // Simpan ID catatan yang sedang diedit
        document.getElementById('add-note').setAttribute('data-edit-id', id);
        document.getElementById('add-note').textContent = "Robih Catatan";
        document.getElementById('cancel-edit').style.display = "inline-block"; // Tampilkan tombol batal

        isEditing = true;
        currentNoteId = id;
    }
};
// Simpan nilai awal
function saveInitialValues() {
    initialTitle = document.getElementById('note-title').value;
    initialContent = document.getElementById('note-content').value;
}
// Fungsi cancelEdit
window.cancelEdit = () => {
    const currentTitle = document.getElementById('note-title').value;
    const currentContent = document.getElementById('note-content').value;

    // Bandingkan nilai saat ini dengan nilai awal
    if (currentTitle.trim() !== initialTitle.trim() || currentContent.trim() !== initialContent.trim()) {
        const confirmCancel = showConfirmPopup("Yakin bade batalkeun?", () => {
            resetForm();
            isEditing = false; // Set status editing ke false
            currentNoteId = null; // Reset ID catatan yang sedang diedit
        });

        if (!confirmCancel) {
            return;
        }
    } else {
        // Jika tidak ada perubahan, langsung reset form
        resetForm();
        isEditing = false; // Set status editing ke false
        currentNoteId = null; // Reset ID catatan yang sedang diedit
    }
};

// ** Fungsi untuk menghapus catatan **
window.deleteNote =  (id) => {
    showConfirmPopup("Yakin bade hapus catetan ieu?", async () => {
        const notes = await loadNotes();
        const updatedNotes = notes.filter(note => note.id !== id);
        await saveNotes(updatedNotes);
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

function showAlertPopup(message) {
    document.getElementById("popupAlert").innerText = message;
    document.getElementById("alertPopup").classList.add("show");

    // Hapus event listener lama agar tidak bertumpuk
    const alertButton = document.getElementById("alertAction");
    alertButton.replaceWith(alertButton.cloneNode(true)); // Reset tombol
    document.getElementById("alertAction").addEventListener("click", closeAlertPopup);
}


function closeAlertPopup() {
    document.getElementById("alertPopup").classList.remove("show");
}

document.getElementById('note-content').addEventListener('keydown', function (event) {
    if (event.key === 'Enter') {
        event.preventDefault(); // Hindari Enter default
        
        const textarea = event.target;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = textarea.value;
        
        // Ambil baris terakhir sebelum Enter
        const lines = text.substring(0, start).split("\n");
        const lastLine = lines[lines.length - 1];

        let newText = "\n"; // Default Enter behavior

        // Cek apakah baris sebelumnya adalah angka (1. 2. 3. ...)
        const numberMatch = lastLine.match(/^(\d+)\.\s/);
        if (numberMatch) {
            const nextNumber = parseInt(numberMatch[1], 10) + 1; // Tambah angka berikutnya
            newText = `\n${nextNumber}. `;
        }

        // Cek apakah baris sebelumnya adalah bullet (- atau •)
        const bulletMatch = lastLine.match(/^(\-|\•)\s/);
        if (bulletMatch) {
            newText = `\n${bulletMatch[1]} `;
        }

        // Masukkan teks baru di posisi kursor
        textarea.value = text.substring(0, start) + newText + text.substring(end);
        textarea.selectionStart = textarea.selectionEnd = start + newText.length;
    }
});


function formatDate(dateString) {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${day}-${month}-${year} ${hours}:${minutes}`;
}