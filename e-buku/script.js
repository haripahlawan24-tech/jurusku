// FITUR BARU: Menutup Splash Screen dengan Animasi
function tutupSplash() {
    const splash = document.getElementById('splash-screen');
    
    // Tambahkan class yang memicu CSS animasi slide-up
    splash.classList.add('splash-hidden');
    
    // Hapus kunci scroll di body agar web bisa digeser lagi
    document.body.classList.remove('no-scroll');
    
    // Tunggu animasi CSS selesai (800ms) baru sembunyikan elemen sepenuhnya
    setTimeout(() => {
        splash.style.display = 'none';
        
        // Panggil animasi item agar bermunculan setelah splash tertutup
        jalankanAnimasiScroll();
        
        // Opsional: Fokuskan kursor ke kolom pencarian otomatis
        document.getElementById('search-input').focus();
    }, 800); 
}

// Fitur 2: Sapaan Waktu
function aturSapaan() {
    const jam = new Date().getHours();
    let teksSapaan = "";
    if (jam >= 5 && jam < 11) teksSapaan = "Selamat pagi! Awali harimu dengan semangat baru. ☀️";
    else if (jam >= 11 && jam < 15) teksSapaan = "Selamat siang! Sambil istirahat, cari hiburan seru yuk. 🌤️";
    else if (jam >= 15 && jam < 18) teksSapaan = "Selamat sore! Santai sejenak yuk. 🌇";
    else teksSapaan = "Selamat malam! Waktunya relaksasi dan nambah wawasan. 🌙";
    document.getElementById('sapaan-waktu').innerText = teksSapaan;
}

// Fitur 3: Animasi muncul saat di-scroll
function jalankanAnimasiScroll() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('show');
            }
        });
    });
    const hiddenElements = document.querySelectorAll('.hidden');
    hiddenElements.forEach((el) => observer.observe(el));
}

// Fitur 4: Dark Mode
function aturTema() {
    const themeBtn = document.getElementById("theme-toggle");
    themeBtn.addEventListener("click", () => {
        const currentTheme = document.documentElement.getAttribute("data-theme");
        let targetTheme = currentTheme === "light" ? "dark" : "light";
        themeBtn.innerText = targetTheme === "light" ? "🌙 Mode Gelap" : "☀️ Mode Terang";
        document.documentElement.setAttribute("data-theme", targetTheme);
    });
}

// Fitur 5: Filter Kategori 
function filterItem(kategoriAwal) {
    const buttons = document.querySelectorAll('.btn-filter');
    buttons.forEach(btn => btn.classList.remove('aktif'));
    event.currentTarget.classList.add('aktif');

    const kartu = document.querySelectorAll('.kartu-item');
    kartu.forEach(item => {
        if (kategoriAwal === 'semua') {
            item.classList.remove('d-none');
        } else {
            if (item.getAttribute('data-kategori') === kategoriAwal) {
                item.classList.remove('d-none');
            } else {
                item.classList.add('d-none');
            }
        }
    });
}

// Fitur 6: Pencarian Realtime & Logika Pesan Kosong
function cariItem() {
    let input = document.getElementById('search-input').value.toLowerCase();
    let clearBtn = document.getElementById('clear-search');
    let kartu = document.querySelectorAll('.kartu-item');
    let adaYangCocok = false;

    // Menampilkan atau menyembunyikan tombol ❌
    if (input.length > 0) {
        clearBtn.classList.remove('d-none');
    } else {
        clearBtn.classList.add('d-none');
    }

    // Filter kartu sesuai ketikan
    kartu.forEach(item => {
        let teks = item.innerText.toLowerCase();
        if (teks.includes(input)) {
            item.style.display = "block";
            adaYangCocok = true;
        } else {
            item.style.display = "none";
        }
    });

    // Menampilkan atau menyembunyikan pesan "Tidak Ditemukan"
    let pesanKosong = document.getElementById('pesan-kosong');
    if (pesanKosong) { 
        if (adaYangCocok) {
            pesanKosong.classList.add('d-none');
        } else {
            pesanKosong.classList.remove('d-none');
        }
    }
}

// Fitur 7: Menghapus Pencarian dengan Tombol ❌
function hapusPencarian() {
    let searchInput = document.getElementById('search-input');
    searchInput.value = ''; // Kosongkan kotak teks
    cariItem(); // Panggil ulang untuk kembalikan tampilan
    searchInput.focus(); // Kembalikan kursor ke dalam kotak
}

// Fitur 8: Modal Cerdas
const modal = document.getElementById("item-modal");

function bukaModal(judul, ikon, tipe) {
    document.getElementById("modal-judul").innerText = judul;
    document.getElementById("modal-icon").innerText = ikon;
    
    let deskripsi = document.getElementById("modal-deskripsi");
    let btnAksi = document.getElementById("btn-modal-aksi");

    if (tipe === 'buku') {
        deskripsi.innerText = "Siapkan posisi duduk paling nyaman untuk membaca!";
        btnAksi.innerText = "Mulai Membaca 📖";
    } else if (tipe === 'video') {
        deskripsi.innerText = "Jangan lupa pakai headset biar suaranya makin seru!";
        btnAksi.innerText = "Putar Video ▶️";
    } else if (tipe === 'game') {
        deskripsi.innerText = "Fokus dan kumpulkan skor tertinggimu!";
        btnAksi.innerText = "Mulai Bermain 🎮";
    } else if (tipe === 'podcast') {
        deskripsi.innerText = "Pasang earphone kamu, rileks, atau tutup matamu sambil mendengarkan!";
        btnAksi.innerText = "Putar Audio 🎧";
    } else if (tipe === 'komik') {
        deskripsi.innerText = "Geser ke kanan untuk melihat halaman komik selanjutnya ya!";
        btnAksi.innerText = "Buka Komik 🖼️";
    }

    modal.style.display = "flex";
}

function tutupModal() { modal.style.display = "none"; }
window.onclick = function(event) { if (event.target == modal) tutupModal(); }

// Menjalankan semua fungsi dasar saat web dibuka (Animasi Scroll ditunda sampai splash ditutup)
window.onload = () => {
    aturSapaan();
    aturTema();
};