let isEditing = false; // Status untuk melacak apakah ada catatan yang sedang diubah
let currentNoteId = null; // ID catatan yang sedang diedit
let quill;
async function loadNotes() {
    return await window.notesAPI.loadNotes();
}

async function saveNotes(notes) {
    await window.notesAPI.saveNotes(notes);
}


document.addEventListener("DOMContentLoaded", function() {
    quill = new Quill('#note-content', {
        theme: 'snow', // Tema editor
        modules: {
            toolbar: [
                ['bold', 'italic', 'underline', 'strike'], // Format teks
                [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                [{ 'size': ['small', false, 'large', 'huge'] }],
                [{ 'color': [] }, { 'background': [] }],
                ['clean']
            ]
        }
    });
});


// ** Fungsi untuk menampilkan catatan **
async function renderNotes() {
    // Jalankan fungsi saat halaman dimuat dan saat ukuran layar berubah
    // window.addEventListener('load', checkTextOverflow);
    // window.addEventListener('resize', checkTextOverflow);
    const notesList = document.getElementById('notes-list');
    notesList.innerHTML = '';
    const notes = await loadNotes();

    // Urutkan terlebih dahulu berdasarkan isPinned, baru berdasarkan lastViewedAt
    notes.sort((a, b) => {
        if (a.isPinned === b.isPinned) {
            const dateA = new Date(a.lastViewedAt || a.updatedAt || 0);
            const dateB = new Date(b.lastViewedAt || b.updatedAt || 0);
            return dateB - dateA; // Descending: yang terakhir dilihat lebih atas
        }
        return b.isPinned - a.isPinned; // Pinned di atas
    });

    notes.forEach((note) => {
        const noteElement = document.createElement('div');
        noteElement.className = 'note-item';
        noteElement.innerHTML = `
            <div class="note-wrapper">
                <div class="note-main">
                    <div class="note-title">${note.title}</div>
                    <div class="note-content" id="note-${note.id}">${note.content.replace(/\n/g, '<br>')}</div>
                    <div class="actions">
                        <button class="edit" onclick="editNote('${note.id}')">Tingal</button>
                        <button class="delete" onclick="deleteNote('${note.id}')">Hapus</button>
                    </div>
                </div>
                <div class="note-toolbar">
                    <div class="tooltip-container">
                        <span class="tooltip">Ditambah: ${formatDate(note.createdAt)}<br>Terakhir Dirobah: ${formatDate(note.updatedAt)}</span>
                        <span style="font-size:20px;">i</span>
                    </div>
                    <label class="pincontainer">
                        <input type="checkbox" ${note.isPinned ? 'checked' : ''} onchange="togglePinNote('${note.id}')" />
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 75 100" class="pin">
                        <line stroke-width="12" stroke="black" y2="100" x2="37" y1="64" x1="37"></line>
                        <path stroke-width="10" stroke="black" d="M16.5 36V4.5H58.5V36V53.75V54.9752L59.1862 55.9903L66.9674 67.5H8.03256L15.8138 55.9903L16.5 54.9752V53.75V36Z"></path>
                        </svg>
                        <span class="tooltip-pin">${note.isPinned ? 'Unpin' : 'Pin'}</span>
                    </label>
                    <button class="copy" onclick="copyToClipboard('${note.id}')">
                        <span data-text-end="Copied!" data-text-initial="Copy to clipboard" class="tooltip_copy"></span>
                        <span>
                            <svg xml:space="preserve" style="enable-background:new 0 0 512 512" viewBox="0 0 6.35 6.35" y="0" x="0" height="20" width="20" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" xmlns="http://www.w3.org/2000/svg" class="clipboard">
                            <g>
                                <path fill="currentColor" d="M2.43.265c-.3 0-.548.236-.573.53h-.328a.74.74 0 0 0-.735.734v3.822a.74.74 0 0 0 .735.734H4.82a.74.74 0 0 0 .735-.734V1.529a.74.74 0 0 0-.735-.735h-.328a.58.58 0 0 0-.573-.53zm0 .529h1.49c.032 0 .049.017.049.049v.431c0 .032-.017.049-.049.049H2.43c-.032 0-.05-.017-.05-.049V.843c0-.032.018-.05.05-.05zm-.901.53h.328c.026.292.274.528.573.528h1.49a.58.58 0 0 0 .573-.529h.328a.2.2 0 0 1 .206.206v3.822a.2.2 0 0 1-.206.205H1.53a.2.2 0 0 1-.206-.205V1.529a.2.2 0 0 1 .206-.206z"></path>
                            </g>
                            </svg>
                            <svg xml:space="preserve" style="enable-background:new 0 0 512 512" viewBox="0 0 24 24" y="0" x="0" height="18" width="18" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" xmlns="http://www.w3.org/2000/svg" class="checkmark">
                            <g>
                                <path data-original="#000000" fill="currentColor" d="M9.707 19.121a.997.997 0 0 1-1.414 0l-5.646-5.647a1.5 1.5 0 0 1 0-2.121l.707-.707a1.5 1.5 0 0 1 2.121 0L9 14.171l9.525-9.525a1.5 1.5 0 0 1 2.121 0l.707.707a1.5 1.5 0 0 1 0 2.121z"></path>
                            </g>
                            </svg>
                        </span>
                    </button>
                </div>
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
            <div class="row justify-between">
                <h3>${note.title}</h3>
                <div style="width: 10px;"></div>
                <div style="display: flex; justify-content:end; gap: 10px; align-items: center">
                    <button class="copy" onclick="copyToClipboard('${note.id}')">
                        <span data-text-end="Copied!" data-text-initial="Copy to clipboard" class="tooltip_copy"></span>
                        <span>
                            <svg xml:space="preserve" style="enable-background:new 0 0 512 512" viewBox="0 0 6.35 6.35" y="0" x="0" height="20" width="20" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" xmlns="http://www.w3.org/2000/svg" class="clipboard">
                            <g>
                                <path fill="currentColor" d="M2.43.265c-.3 0-.548.236-.573.53h-.328a.74.74 0 0 0-.735.734v3.822a.74.74 0 0 0 .735.734H4.82a.74.74 0 0 0 .735-.734V1.529a.74.74 0 0 0-.735-.735h-.328a.58.58 0 0 0-.573-.53zm0 .529h1.49c.032 0 .049.017.049.049v.431c0 .032-.017.049-.049.049H2.43c-.032 0-.05-.017-.05-.049V.843c0-.032.018-.05.05-.05zm-.901.53h.328c.026.292.274.528.573.528h1.49a.58.58 0 0 0 .573-.529h.328a.2.2 0 0 1 .206.206v3.822a.2.2 0 0 1-.206.205H1.53a.2.2 0 0 1-.206-.205V1.529a.2.2 0 0 1 .206-.206z"></path>
                            </g>
                            </svg>
                            <svg xml:space="preserve" style="enable-background:new 0 0 512 512" viewBox="0 0 24 24" y="0" x="0" height="18" width="18" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" xmlns="http://www.w3.org/2000/svg" class="checkmark">
                            <g>
                                <path data-original="#000000" fill="currentColor" d="M9.707 19.121a.997.997 0 0 1-1.414 0l-5.646-5.647a1.5 1.5 0 0 1 0-2.121l.707-.707a1.5 1.5 0 0 1 2.121 0L9 14.171l9.525-9.525a1.5 1.5 0 0 1 2.121 0l.707.707a1.5 1.5 0 0 1 0 2.121z"></path>
                            </g>
                            </svg>
                        </span>
                    </button>
                    <div class="tooltip-container">
                        <span class="tooltip">Ditambih :${formatDate(note.createdAt)}<br>
                        Terakhir Dirobih : ${formatDate(note.updatedAt)}</span>
                        <span style="font-size:20px;">i</span>
                    </div>
                </div>
            </div>
            <div class="note-content" id="note-${note.id}">${note.content.replace(/\n/g, '<br>')}</div>
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
    // const content = document.getElementById('note-content').value.trim();
    const content = quill.root.innerHTML; // HTML yang diformat
    const editId = document.getElementById('add-note').getAttribute('data-edit-id');

    if (!title) {
        title = "Catet!";
    }
    // console.log(content);

    if (content != '<p><br></p>') {
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
                        notes[noteIndex].isPinned = notes[noteIndex].isPinned;
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
                updatedAt: now, // Tanggal terakhir diedit
                lastViewedAt: now,
                isPinned: false // Properti baru untuk pin
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
    // document.getElementById('note-content').textContent   = '';
    quill.setContents([]);
    document.getElementById('add-note').removeAttribute('data-edit-id');
    // document.getElementById('add-note').textContent = "Tambih Catatan";
    document.getElementById('cancel-edit').style.display = "none"; // Sembunyikan tombol batal
}

// ** Fungsi untuk mengedit catatan **
window.editNote = async (id)  => {
    if (isEditing) {
        showAlertPopup("Aya catetan nu keur ditingal, batalkeun atawa simpen heula.");
        return;
    }
    const now = new Date().toISOString(); // Tanggal dan waktu saat ini
    const notes = await loadNotes();
    const noteToEdit = notes.find(note => note.id === id);
    const noteIndex = notes.findIndex(note => note.id === id);
    
    if (noteToEdit) {
        if (noteIndex !== -1) {
            notes[noteIndex].lastViewedAt = now;
            await saveNotes(notes);
            await renderNotes(); // 🔥 Tambahkan ini agar langsung render ulang
        }

        document.getElementById('note-title').value = noteToEdit.title;
        quill.root.innerHTML  = noteToEdit.content;
        saveInitialValues();

        // Simpan ID catatan yang sedang diedit
        document.getElementById('add-note').setAttribute('data-edit-id', id);
        // document.getElementById('add-note').textContent = "Robih Catatan";
        document.getElementById('cancel-edit').style.display = "inline-block"; // Tampilkan tombol batal

        isEditing = true;
        currentNoteId = id;
    }
};
// Simpan nilai awal
function saveInitialValues() {
    initialTitle = document.getElementById('note-title').value;
    initialContent = quill.root.innerHTML;;
}
// Fungsi cancelEdit
window.cancelEdit = () => {
    const currentTitle = document.getElementById('note-title').value;
    const currentContent = quill.root.innerHTML;;

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

// document.getElementById('note-content').addEventListener('keydown', function (event) {
//     if (event.key === 'Enter') {
//         event.preventDefault(); // Hindari Enter default
        
//         const textarea = event.target;
//         const start = textarea.selectionStart;
//         const end = textarea.selectionEnd;
//         const text = textarea.value;
        
//         // Ambil baris terakhir sebelum Enter
//         const lines = text.substring(0, start).split("\n");
//         const lastLine = lines[lines.length - 1];

//         let newText = "\n"; // Default Enter behavior

//         // Cek apakah baris sebelumnya adalah angka (1. 2. 3. ...)
//         const numberMatch = lastLine.match(/^(\d+)\.\s/);
//         if (numberMatch) {
//             const nextNumber = parseInt(numberMatch[1], 10) + 1; // Tambah angka berikutnya
//             newText = `\n${nextNumber}. `;
//         }

//         // Cek apakah baris sebelumnya adalah bullet (- atau •)
//         const bulletMatch = lastLine.match(/^(\-|\•)\s/);
//         if (bulletMatch) {
//             newText = `\n${bulletMatch[1]} `;
//         }

//         // Masukkan teks baru di posisi kursor
//         textarea.value = text.substring(0, start) + newText + text.substring(end);
//         textarea.selectionStart = textarea.selectionEnd = start + newText.length;
//     }
// });


function formatDate(dateString) {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${day}-${month}-${year} ${hours}:${minutes}`;
}

function copyToClipboard(noteId) {
    const noteContent = document.getElementById(`note-${noteId}`).innerText; // Ambil teks asli (tanpa HTML)
    
    navigator.clipboard.writeText(noteContent).then(() => {
       
    }).catch(err => console.error('Failed to copy:', err));
}

// function checkTextOverflow() {
//     const h3Elements = document.querySelectorAll('.row.justify-between h3');

//     h3Elements.forEach(h3 => {
//         // Periksa apakah teks melebihi lebar container
//         if (h3.scrollWidth > h3.clientWidth) {
//             h3.classList.add('scrolling-text'); // Tambahkan class untuk animasi
//         } else {
//             h3.classList.remove('scrolling-text'); // Hapus class jika tidak overflow
//         }
//     });
// }


// Responsive
function toggleMainContent() {
    const mainContent = document.querySelector('.main-content');
    const sidebar = document.querySelector('.sidebar');
    if (mainContent.style.display === 'none' || mainContent.style.display === '') {
        mainContent.style.display = 'flex'; // Tampilkan main-content
        sidebar.style.display = 'none'; // Tampilkan main-content
        sidebar.style.width = '100%'; // Tampilkan main-content
    } else {
        mainContent.style.display = 'none'; // Sembunyikan main-content
        sidebar.style.display = 'flex'; // Tampilkan sidebar
        sidebar.style.width = '100%'; // Tampilkan main-content
    }
}

async function togglePinNote(id) {
    const notes = await loadNotes();
    const noteIndex = notes.findIndex(note => note.id === id);
    
    if (noteIndex !== -1) {
        notes[noteIndex].isPinned = !notes[noteIndex].isPinned; // Toggle status pin
        await saveNotes(notes);
        renderNotes(); // Render ulang setelah status pin diubah
    }
}