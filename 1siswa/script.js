const FIREBASE_URL = "https://jurnalku-49dbd-default-rtdb.asia-southeast1.firebasedatabase.app/jurusku";
const FIREBASE_USERS_URL = "https://jurnalku-49dbd-default-rtdb.asia-southeast1.firebasedatabase.app/jurusku_users";

let currentUser = null;
let chart = null;
let currentDate = new Date();
let data = {}; 
let usersData = {}; 
let viewLbDate = new Date(); // Default adalah bulan saat ini

// === TAMBAHAN VARIABEL FITUR AVATAR (Hewan Lucu, Friendly, & Banyak) ===
const emotAvatars = [
    '🐱','🐹','🐰','🦊',
	'🐻','🐼','🐻‍❄️','🐨',
	'🐯','🦁','🐮','🐸',
	'🐵','🐶','🦝','🐺',
    '🐣','🐤','🐥','🐔',
	'🐦','🐧','🕊️','🦉',
	'🦆','🦢','🦩','🦚',
	'🦜','🐢','🐡','🐠',
    '🐟','🐬','🐳','🐋',
	'🐘','🦒','🦘','🐏',
	'🐑','🐐','🦌','🐕',
	'🐩','🐈','🐇','🐿️',
	'🦫','🦔','🦦','🦥',
	'🦄','🐴','🐲','🦋'
];
let cropper = null;
let originalAvatarData = ""; // Foto asli di database
let currentAvatarData = "";  // Foto pratinjau sebelum disimpan
// ======================================


// Variabel Filter Leaderboard (Default: Global)
let currentLbFilter = "global";

const jadwalSholat = { 'Subuh': {mulai:"04:00",akhir:"05:30"}, 'Dzuhur': {mulai:"11:30",akhir:"15:00"}, 'Ashar': {mulai:"15:00",akhir:"18:00"}, 'Maghrib':{mulai:"17:20",akhir:"19:15"}, 'Isya': {mulai:"18:20",akhir:"23:59"} };

function safeKey(str) { return str.replace(/\./g, ','); }
function restoreKey(str) { return str.replace(/,/g, '.'); }

function showToast(msg) {
    let x = document.getElementById("toast");
    x.innerHTML = msg; 
    x.className = "show";
    setTimeout(() => { x.className = x.className.replace("show", ""); }, 3000);
}

function formatTanggalKey() { 
    let d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); 
}

function getBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader(); reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result); reader.onerror = error => reject(error);
    });
}

function togglePass() {
    let passInput = document.getElementById("password");
    let icon = document.getElementById("togglePassword");
    if (passInput.type === "password") {
        passInput.type = "text";
        icon.innerText = "😮";
    } else {
        passInput.type = "password";
        icon.innerText = "😴";
    }
}

// === TAMBAHAN FUNGSI FITUR AVATAR ===
function renderEmotAvatars() {
    let container = document.getElementById("emotContainer");
    if(!container) return;
    container.innerHTML = "";
    
    // Inject style agar bisa di scroll karena hewan banyak
	container.style.maxHeight = "260px";
    container.style.overflowY = "auto";
    container.style.overscrollBehavior = "contain"; // Mencegah kebocoran scroll ke luar batas elemen
    container.style.padding = "5px";
    container.style.justifyContent = "center";

    emotAvatars.forEach(emot => {
        let btn = document.createElement("div");
        btn.innerText = emot;
        btn.style.cssText = "font-size: 2.2rem; cursor: pointer; padding: 5px; border-radius: 10px; background: #f1f5f9; transition: all 0.2s;";
		btn.onclick = () => {
            selectEmotAvatar(emot);
            document.getElementById('avatarModal').style.display = 'none';
            document.body.style.overflow = 'auto'; // Buka kembali scroll Profil saat emot dipilih
        };
        container.appendChild(btn);
    });
}

function showAvatarModal() { 
    document.getElementById('avatarModal').style.display = 'flex'; 
    document.body.style.overflow = 'hidden'; // Kunci scroll background Profil
}


function showHapusModal() { document.getElementById('hapusModal').style.display = 'flex'; }

function selectEmotAvatar(emot) {
    currentAvatarData = emot;
    document.getElementById("profilAvatarDisplay").innerHTML = emot;
    document.getElementById("editAvatar").value = "";
    showToast("✔️ Avatar dipilih, untuk Perubahan tekan Simpan.");
}

function confirmHapusAvatar() {
    // Pilih hewan acak saat menghapus foto
    let randomAvatar = emotAvatars[Math.floor(Math.random() * emotAvatars.length)];
    currentAvatarData = randomAvatar;
    document.getElementById("profilAvatarDisplay").innerHTML = randomAvatar;
    document.getElementById("editAvatar").value = "";
    document.getElementById('hapusModal').style.display = 'none';
    showToast("🗑️ Foto dihapus (diganti hewan acak), untuk Perubahan tekan Simpan.");
}

function batalUbahAvatar(showToastMsg = false) {
    currentAvatarData = originalAvatarData;
    updateAvatarDisplay();
    document.getElementById("editAvatar").value = "";
    if (showToastMsg) showToast("❌ Perubahan foto dibatalkan.");
}


function previewCrop(event) {
    let file = event.target.files[0];
    
    // 1. Jika tidak ada file yang dipilih, batalkan
    if (!file) return;

    // 2. VALIDASI: Tolak file jika bukan gambar (video, dokumen, suara dll)
    if (!file.type.match('image.*')) {
        showToast("❌ Gagal! Hanya boleh memilih file Foto/Gambar (JPG, PNG, dll).");
        event.target.value = ""; // Kosongkan input agar bisa pilih ulang
        return;
    }

    // 3. Jika file valid (gambar), lanjutkan proses crop
    let reader = new FileReader();
    reader.onload = function(e) {
        let image = document.getElementById('imageToCrop');
        image.src = e.target.result;
        document.getElementById('cropModal').style.display = "flex";
        if (cropper) cropper.destroy();
        cropper = new Cropper(image, { aspectRatio: 1, viewMode: 1 });
    }
    reader.readAsDataURL(file);
}

function cancelCrop() {
    document.getElementById('cropModal').style.display = "none";
    document.getElementById("editAvatar").value = "";
    if (cropper) { cropper.destroy(); cropper = null; }
}

function saveCrop() {
    if (!cropper) return;

    // 1. KOMPRESI DIMENSI: Paksa ukuran maksimal 300x300 pixel
    let canvas = cropper.getCroppedCanvas({
        width: 300,
        height: 300,
        imageSmoothingEnabled: true,
        imageSmoothingQuality: 'high'
    });

    // 2. KOMPRESI UKURAN FILE: Ubah ke JPEG dan turunkan kualitas ke 60% (0.6)
    // base64 inilah yang nantinya tersimpan di Firebase. Ukurannya sangat kecil!
    let compressedBase64 = canvas.toDataURL('image/jpeg', 0.6);

    // 3. Masukkan hasil kompresi ke variabel bawaan aslimu
    currentAvatarData = compressedBase64; 

    // 4. Update tampilan UI menggunakan fungsi aslimu
    updateAvatarDisplay();

    // 5. Tutup modal dan bersihkan memori cropper
    document.getElementById('cropModal').style.display = "none";
    cropper.destroy(); 
    cropper = null;

    // 6. Tampilkan notifikasi
    showToast("📸 Foto dipilih, untuk Perubahan tekan Simpan.");
}

function updateAvatarDisplay() {
    let profAva = document.getElementById("profilAvatarDisplay");
    if(profAva) {
        profAva.style.backgroundColor = "#fff";
        profAva.style.borderColor = "#228b22"; // Border Hijau Forest Profil
    }

    if(currentAvatarData && currentAvatarData.startsWith('data:image')) {
        profAva.innerHTML = `<img src="${currentAvatarData}" style="width:100%; height:100%; object-fit:cover;">`;
    } else {
        profAva.innerHTML = currentAvatarData || "👤"; // Fallback aman
    }
}
// === END TAMBAHAN FUNGSI FITUR AVATAR ===


// === LOGIKA E-ASESMEN FULL SCREEN ===
function mulaiUjian(url) {
    let elem = document.documentElement;
    if (elem.requestFullscreen) {
        elem.requestFullscreen().catch(err => console.log(err));
    } else if (elem.webkitRequestFullscreen) { /* Safari */
        elem.webkitRequestFullscreen();
    } else if (elem.msRequestFullscreen) { /* IE11 */
        elem.msRequestFullscreen();
    }
    document.getElementById('examFrame').src = url;
    document.getElementById('examContainer').style.display = "block";
}

function closeExam() {
    if(confirm("Apakah kamu yakin ingin keluar dari halaman ujian? Pastikan jawaban sudah dikirim!")) {
        document.getElementById('examContainer').style.display = "none";
        document.getElementById('examFrame').src = "";
        if (document.exitFullscreen) {
            document.exitFullscreen().catch(err => console.log(err));
        } else if (document.webkitExitFullscreen) { /* Safari */
            document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) { /* IE11 */
            document.msExitFullscreen();
        }
    }
}

// === LOGIKA DEEP LINKING KE GOOGLE CHROME ===
function bukaDiChrome(url) {
    // Hilangkan https:// atau http:// untuk dimasukkan ke skema deep link
    let cleanUrl = url.replace(/^https?:\/\//, '');
    let userAgent = navigator.userAgent || navigator.vendor || window.opera;

    if (/android/i.test(userAgent)) {
        // Deep link khusus Android: Memaksa buka package com.android.chrome
        // Jika chrome tidak ada, fallback_url akan membukanya di browser bawaan
        window.location.href = `intent://${cleanUrl}#Intent;scheme=https;package=com.android.chrome;S.browser_fallback_url=${encodeURIComponent(url)};end`;
    } 
    else if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) {
        // Deep link khusus iOS untuk Google Chrome
        let scheme = url.startsWith('https') ? 'googlechromes://' : 'googlechrome://';
        window.location.href = scheme + cleanUrl;
        
        // Fallback: Jika pengguna iOS tidak punya Chrome, buka di Safari setelah 500ms
        setTimeout(() => {
            window.location.href = url;
        }, 500);
    } 
    else {
        // Jika dibuka di Laptop/PC desktop, buka di Tab Baru (otomatis browser default)
        window.open(url, '_blank');
    }
}

async function loadDatabase() {
    try {
        let [resData, resUsers] = await Promise.all([ fetch(FIREBASE_URL + ".json"), fetch(FIREBASE_USERS_URL + ".json") ]);
        data = (await resData.json()) || {}; usersData = (await resUsers.json()) || {};
    } catch (e) { console.log("Gagal mengambil update Realtime."); }
}

async function syncToFirebase() {
    let t = formatTanggalKey();
    await fetch(`${FIREBASE_URL}/${t}/${currentUser}.json`, { method: 'PUT', body: JSON.stringify(data[t][currentUser]) });
    await loadDatabase();
    if(document.getElementById('leaderboard').style.display === "block") renderLeaderboard();
}

async function login() {
    let rawU = document.getElementById("username").value.trim();
    let p = document.getElementById("password").value.trim();
    
    if (/[\#\$\[\]]/.test(rawU)) { showToast("⚠️ Username tidak boleh menggunakan simbol khusus."); return; }
    if (!rawU || !p) { showToast("⚠️ Harap isi Username dan Password."); return; }
    
    let btn = document.getElementById("btnLogin"); btn.innerText = "Memeriksa..."; btn.disabled = true;

    try {
        let dbKey = safeKey(rawU); 
        let res = await fetch(FIREBASE_USERS_URL + "/" + dbKey + ".json");
        let userData = await res.json();

        if (!userData) {
            showToast("❌ Akun tidak ditemukan. Mengembalikan ke halaman login...");
            
            // 1. Hapus semua data sesi akun yang tersangkut di perangkat
            localStorage.removeItem("jurusku_user"); 
            localStorage.removeItem("jurusku_pass");
            localStorage.removeItem("saved_user");
            localStorage.removeItem("saved_pass");
            localStorage.removeItem("saved_pin");
            
            // 2. Tutup halaman lain dan tampilkan kembali halaman Login
            if (document.getElementById("pinPage")) document.getElementById("pinPage").style.display = "none";
            if (document.getElementById("menu")) document.getElementById("menu").style.display = "none";
            document.querySelectorAll(".page").forEach(p => p.style.display = "none");
            document.getElementById("loginPage").style.display = "block";
            
            // 3. Kosongkan kolom isian username dan password
            document.getElementById("username").value = "";
            document.getElementById("password").value = "";
            
            // Kembalikan tombol masuk seperti semula
            btn.innerText = "Masuk"; 
            btn.disabled = false; 
            return;
        }

        if (userData.password !== p) {
            showToast("❌ Password salah. Silakan coba lagi.");
            btn.innerText = "Masuk"; btn.disabled = false; return;
        }

        currentUser = dbKey; 
        
        localStorage.setItem("jurusku_user", rawU); 
        localStorage.setItem("jurusku_pass", p);
        
        localStorage.setItem("saved_user", rawU);
        localStorage.setItem("saved_pass", p);

        await loadDatabase();

        let userNama = userData.nama || rawU;
        let userKelas = userData.kelas || "-";
        
        document.getElementById("greetName").innerText = userNama;
        // Hilangkan emot default
        document.getElementById("userLabel").innerText = userNama + " | " + userKelas;
        document.getElementById("usernameLabel").innerText = "Username: " + rawU;
        document.getElementById("editNama").value = userNama;
        document.getElementById("editKelas").value = userKelas;
        document.getElementById("editPassword").value = p;
        
        // Load Avatar Lama ATAU Pilih Hewan Random
        if (userData.avatar && userData.avatar !== "🧑") { 
            originalAvatarData = userData.avatar; 
        } else { 
            let randomAvatar = emotAvatars[Math.floor(Math.random() * emotAvatars.length)];
            originalAvatarData = randomAvatar;
            // Simpan langsung ke database agar leaderboard sinkron
            fetch(FIREBASE_USERS_URL + "/" + currentUser + ".json", { 
                method: 'PATCH',
                body: JSON.stringify({ avatar: randomAvatar }) 
            });
        }
        
        currentAvatarData = originalAvatarData;
        updateAvatarDisplay();
        renderEmotAvatars();

        document.getElementById("filterTanggal").value = formatTanggalKey();
        
        document.getElementById("loginPage").style.display = "none";
        document.getElementById("menu").style.display = "flex";
        showPage("monitor");
        tampilTanggal(); loadKebiasaan();
        startRealtimeRefresh();
		
    } catch (e) { showToast("Gagal terhubung ke server."); }
    
    btn.innerText = "Masuk"; btn.disabled = false;
}

// Realtime Refresh Mechanism
let pollingInterval = null;
function startRealtimeRefresh() {
    if (pollingInterval) clearInterval(pollingInterval);
    pollingInterval = setInterval(async () => {
        if (currentUser) {
            // 1. Cek apakah user sedang berada di dalam elemen input/textarea
            let activeTag = document.activeElement ? document.activeElement.tagName.toLowerCase() : "";
            let isTyping = (activeTag === "textarea" || activeTag === "input");

            await loadDatabase();
            
            // ==========================================
            // TAMBAHKAN LOGIKA AUTO-LOGOUT DI SINI
            // ==========================================
            let savedPass = localStorage.getItem("jurusku_pass");
            
            // Cek apakah user dihapus admin ATAU password di database tidak sama dengan di penyimpanan lokal
            if (!usersData[currentUser] || usersData[currentUser].password !== savedPass) {
                showToast("⚠️ Sesi berakhir! Username atau Password telah diubah oleh Admin.");
                clearInterval(pollingInterval); // Hentikan refresh
                
                // Tunggu 2.5 detik agar pesan terbaca, lalu paksa logout
                setTimeout(() => {
                    logout(); 
                }, 2500);
                
                return; // Batalkan proses render di bawahnya
            }
            // ==========================================

            // 2. Cegah render ulang UI 'monitor' JIKA user sedang mengetik
            if(document.getElementById('monitor').style.display === 'block' && !isTyping) {
                loadKebiasaan();
            }
            
            if(document.getElementById('dashboard').style.display === 'block') updateView();
            if(document.getElementById('leaderboard').style.display === 'block') renderLeaderboard();
        }
    }, 15000); 
}

async function simpanProfil() {
    let newN = document.getElementById("editNama").value.trim();
    let newK = document.getElementById("editKelas").value.trim();
    let newP = document.getElementById("editPassword").value.trim();

    if (!newN || !newP || !newK) { showToast("⚠️ Data profil tidak boleh kosong."); return; }

    let btn = document.getElementById("btnSimpanProfil"); btn.innerText = "Menyimpan..."; btn.disabled = true;

    try {
        let newAvatarBase64 = currentAvatarData; 

        await fetch(FIREBASE_USERS_URL + "/" + currentUser + ".json", { 
            method: 'PATCH',
            body: JSON.stringify({ nama: newN, kelas: newK, password: newP, avatar: newAvatarBase64 }) 
        });

        localStorage.setItem("jurusku_pass", newP);
        localStorage.setItem("saved_pass", newP); 
        document.getElementById("userLabel").innerText = newN + " | " + newK;
        document.getElementById("greetName").innerText = newN; 
        
        originalAvatarData = newAvatarBase64;
        updateAvatarDisplay();
        document.getElementById("editAvatar").value = "";

        await loadDatabase();
        showToast("✅ Profil berhasil diperbarui.");
        
        if (currentLbFilter !== "global") renderLeaderboard(); 
    } catch (e) { showToast("Server sedang bermasalah."); }

    btn.innerText = "Simpan"; btn.disabled = false;
}

function logout() {
    localStorage.removeItem("jurusku_user"); 
    localStorage.removeItem("jurusku_pass"); 
    location.reload(); 
}

// Fungsi untuk memunculkan modal konfirmasi keluar
function konfirmasiLogout() {
    // Menggunakan elemen toast konfirmasi yang sudah ada di HTML
    const confirmToast = document.getElementById("confirmToast");
    const overlay = document.getElementById("overlay");
    
    // Mengubah konten teks di dalam toast konfirmasi agar relevan dengan Logout
    confirmToast.querySelector("div").innerText = "🚪"; 
    confirmToast.querySelector("p").innerHTML = "Apakah kamu yakin ingin keluar?<br>kamu harus login ulang nanti.";
    
    // Mengubah fungsi pada tombol YA agar memanggil logout asli, dan TIDAK untuk menutup modal
    confirmToast.querySelector(".btn-ya").setAttribute("onclick", "logout()");
    confirmToast.querySelector(".btn-tidak").setAttribute("onclick", "tutupKonfirmasiLogout()");
    
    // Tampilkan modal
    confirmToast.classList.add("show");
    overlay.classList.add("show");
}

// Fungsi untuk menutup modal jika batal keluar
function tutupKonfirmasiLogout() {
    document.getElementById("confirmToast").classList.remove("show");
    document.getElementById("overlay").classList.remove("show");
    
    // Mengembalikan fungsi tombol ke pengaturan awal (untuk fitur Tidur) agar tidak bentrok
    setTimeout(() => {
        document.getElementById("confirmToast").querySelector(".btn-ya").setAttribute("onclick", "confirmSleep(true)");
        document.getElementById("confirmToast").querySelector(".btn-tidak").setAttribute("onclick", "confirmSleep(false)");
    }, 300);
}

function getHariIni() {
    let t = formatTanggalKey();
    if (!data[t]) data[t] = {};
    if (!data[t][currentUser]) data[t][currentUser] = { poin: 0, pilar: { sholat:0, olahraga:0, makan:0, belajar:0, masyarakat:0, bangun:0, tidur:0 }, inputs: { olahraga: "", makan: "", belajar: "", masyarakat: "" } };
    return data[t][currentUser];
}

function showPage(id) {
    // 1. Reset Top Skor ke bulan saat ini dan filter GLOBAL jika pindah ke menu lain
    if (id !== 'leaderboard') {
        viewLbDate = new Date(); // Reset tanggal ke hari ini
        currentLbFilter = "global"; // Reset filter ke global

        // Reset visual tombol filter agar kembali aktif di 'GLOBAL'[cite: 2, 3]
        document.querySelectorAll('.lb-filter-btn').forEach(btn => btn.classList.remove('active'));
        const globalBtn = document.getElementById('filter-global');
        if (globalBtn) globalBtn.classList.add('active');
    }

    // 2. Batalkan pratinjau avatar jika keluar dari menu Profil (ID: setting)[cite: 1, 2]
    if (id !== 'setting' && typeof batalUbahAvatar === 'function') {
        batalUbahAvatar(false);
    }

    // 3. Sembunyikan semua halaman dan kelola status aktif tombol navigasi[cite: 1, 2, 3]
    document.querySelectorAll(".page").forEach(p => p.style.display = "none");
    document.querySelectorAll("nav button").forEach(b => b.classList.remove("active"));
    
    // Tampilkan halaman yang dipilih dan aktifkan tombolnya[cite: 1, 2]
    document.getElementById(id).style.display = "block";
    document.getElementById("btn-" + id).classList.add("active");
    
    // 4. Atur tampilan Greeting Bar (hanya untuk Progres dan Jurnal)[cite: 2, 3]
    if(id === 'dashboard' || id === 'monitor') {
        document.getElementById("greetingBar").style.display = "block";
    } else {
        document.getElementById("greetingBar").style.display = "none";
    }

    // 5. Logika Refresh Khusus saat membuka halaman
    if(id === 'dashboard') {
        updateView(); // Memperbarui grafik progres
    }

    if(id === 'leaderboard') {
        // REFRESH: Ambil data terbaru dari Firebase sebelum merender peringkat[cite: 2]
        loadDatabase().then(() => {
            renderLeaderboard();
        });
    }
}

function setLbFilter(filter) {
    currentLbFilter = filter;
    document.querySelectorAll('.lb-filter-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById('filter-' + filter).classList.add('active');
    renderLeaderboard();
}

function changeLbMonth(offset) {
    viewLbDate.setMonth(viewLbDate.getMonth() + offset);
    renderLeaderboard();
}

function renderLeaderboard() {
    let userScoresTotal = {};
    let userCounts = {}; 
    
    const namaBulanArr = ["JANUARI", "FEBRUARI", "MARET", "APRIL", "MEI", "JUNI", "JULI", "AGUSTUS", "SEPTEMBER", "OKTOBER", "NOVEMBER", "DESEMBER"];
	const tanggalSekarang = viewLbDate; // Menggunakan tanggal yang dipilih siswa
	const bulanSekarang = tanggalSekarang.getMonth() + 1; 
	const tahunSekarang = tanggalSekarang.getFullYear();
    
	
	const namaBulan = ["JANUARI", "FEBRUARI", "MARET", "APRIL", "MEI", "JUNI", 
                   "JULI", "AGUSTUS", "SEPTEMBER", "OKTOBER", "NOVEMBER", "DESEMBER"];

	// Mengambil nama bulan dan tahun dari viewLbDate
	const labelBulan = namaBulan[viewLbDate.getMonth()];
	const labelTahun = viewLbDate.getFullYear();

	document.getElementById("judulLeaderboardBulan").innerText = `${labelBulan} ${labelTahun}`;


    if(labelBulan) {
        labelBulan.innerText = "BULAN " + namaBulanArr[tanggalSekarang.getMonth()];
    }

    // 1. Kumpulkan Data Skor
    for (let dateStr in data) { 
        let parts = dateStr.split('-');
        if(parts.length === 3) {
            let y = parseInt(parts[0]);
            let m = parseInt(parts[1]);
            
            if(y === tahunSekarang && m === bulanSekarang) {
                for (let user in data[dateStr]) {
                    if (!userScoresTotal[user]) {
                        userScoresTotal[user] = 0;
                        userCounts[user] = 0;
                    }
                    userScoresTotal[user] += (data[dateStr][user].poin || 0);
                    userCounts[user]++; 
                }
            }
        }
    }

    // 2. Hitung Rata-rata Skor
    let userAvgScores = {};
    for (let user in userScoresTotal) {
        userAvgScores[user] = Math.round(userScoresTotal[user] / userCounts[user]);
    }

    // 3. Dapatkan Info Kelas User Saat Ini
    let myKelas = "";
    let myGrade = "";
    if (currentUser && usersData[currentUser]) {
        myKelas = usersData[currentUser].kelas || "-";
        myGrade = myKelas.match(/\d+/)?.[0] || "-"; 
    }

    // 4. Siapkan Data Mentah (Termasuk Total Poin Murni untuk Tie-Breaker)
    let rawUsers = Object.keys(userAvgScores).map(user => { 
        return { username: user, score: userAvgScores[user], totalScore: userScoresTotal[user] }; 
    });

    // 5. Filter Data Sesuai Pilihan (Global/Regional/Kelas)
    let filteredUsers = rawUsers.filter(u => {
        // TAMBAHAN: Jika akun sudah tidak ada/dihapus, JANGAN tampilkan di Leaderboard
        if (!usersData[u.username]) return false;

        let uKelas = usersData[u.username]?.kelas || "-";
        if (currentLbFilter === 'regional') {
            let uGrade = uKelas.match(/\d+/)?.[0] || "-";
            return uGrade === myGrade && myGrade !== "-";
        } else if (currentLbFilter === 'kelas') {
            return uKelas === myKelas && myKelas !== "-";
        }
        return true;
    });

    // 6. URUTKAN DATA (Logika Tie-Breaker)
    // Rata-rata tertinggi -> Jika kembar, Total Poin tertinggi -> Jika kembar, Abjad Username
    let sortedUsers = filteredUsers.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score; 
        if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore; 
        return a.username.localeCompare(b.username); 
    });

    // 7. HAPUS NILAI KEMBAR DI TAMPILAN (Kurangi 1 poin secara otomatis ke bawah)
    for (let i = 1; i < sortedUsers.length; i++) {
        if (sortedUsers[i].score >= sortedUsers[i-1].score) {
            sortedUsers[i].score = Math.max(0, sortedUsers[i-1].score - 1);
        }
    }

    // 8. RENDER PODIUM JUARA (Top 3)
    let podiumHtml = ''; 
    let podiumIndices = [1, 0, 2]; 
    let podiumClasses = ['podium-2', 'podium-1', 'podium-3']; 
    let fallbackAvatars = ['🐼', '🐰', '🐱']; 
    let medals = ['🥈', '🥇', '🥉'];
    
    let podiumBorderColors = ['#ffb74d', '#ffd700', '#ff9800']; 
    let podiumScoreSizes = ['1.4rem', '1.7rem', '1.2rem'];
    let podiumAvatarSizes = ['2.4rem', '3.4rem', '2rem'];

    for (let i = 0; i < 3; i++) {
        let indexArray = podiumIndices[i];
        if (sortedUsers[indexArray]) {
            let u = sortedUsers[indexArray];
            let uData = usersData[u.username] || {};
            let namaTampil = uData.nama || restoreKey(u.username);
            let uKelas = uData.kelas ? uData.kelas : '-';
            
            let userAva = (uData.avatar && uData.avatar !== "🧑") ? uData.avatar : fallbackAvatars[i];
            let avatarHTML = userAva.startsWith('data:image') ? `<img src="${userAva}">` : userAva;
            let rankBadge = `<div class="rank-badge" style="color:#000; border: 2px solid ${podiumBorderColors[i]};">${medals[i]}</div>`;
            
            podiumHtml += `
            <div class="lb-podium-item ${podiumClasses[i]}" style="background: #fff !important; border: 3px solid ${podiumBorderColors[i]}; border-radius: 20px;">
                <div class="lb-avatar" style="background: #fff; border: 4px solid ${podiumBorderColors[i]} !important; font-size:${podiumAvatarSizes[i]};">
                    ${avatarHTML}
                    ${rankBadge}
                </div>
                <div class="lb-podium-name">${namaTampil}</div>
                <div class="lb-podium-kelas">Kelas ${uKelas}</div>
                <div class="lb-podium-score" style="font-size: ${podiumScoreSizes[i]};">${u.score}</div>
            </div>`;
        } else {
            podiumHtml += `<div class="lb-podium-item ${podiumClasses[i]}" style="background: #fff !important; border: 3px solid ${podiumBorderColors[i]}; opacity:0.5; justify-content:center; border-radius: 20px;"><div class="lb-podium-name">-</div><div class="lb-podium-score" style="font-size: ${podiumScoreSizes[i]};">0</div></div>`;
        }
    }
    document.getElementById("lb-podium-container").innerHTML = podiumHtml;
    
    // 9. RENDER LIST PERINGKAT BAWAH (Peringkat 4 - 10)
    let listHtml = '';
    const borderHijauForest = '#228b22';

    for (let i = 3; i < 10; i++) {
        if (sortedUsers[i]) {
            let u = sortedUsers[i]; 
            let uData = usersData[u.username] || {}; 
            let namaTampil = uData.nama || restoreKey(u.username); 
            let uKelas = uData.kelas ? uData.kelas : '-';
            
            let fallbackIndex = u.username.length % emotAvatars.length;
            let fallbackAvatar = emotAvatars[fallbackIndex]; 
            
            let userAva = (uData.avatar && uData.avatar !== "🧑") ? uData.avatar : fallbackAvatar;
            let avatarHTML = userAva.startsWith('data:image') ? `<img src="${userAva}">` : userAva;
            
            listHtml += `<div class="lb-item"><div class="lb-item-num">${i + 1}</div><div class="lb-item-avatar" style="background:#fff; border: 2px solid ${borderHijauForest}; font-size:1.5rem;">${avatarHTML}</div><div class="lb-item-info"><div style="display:flex; flex-direction:column; max-width: 70%;"><span class="lb-item-name">${namaTampil}</span><span style="font-size:0.75rem; color:#94a3b8; font-weight:bold; margin-top:3px;">Kelas ${uKelas}</span></div><span class="lb-item-score" style="font-size: 1.1rem;">${u.score}</span></div></div>`;
        }
    }
    
    // Jika data kosong
    if(!listHtml && sortedUsers.length <= 3) {
        listHtml = `<div style="text-align:center; padding: 20px; color:#ffffff;">Belum ada data peringkat untuk bulan ini dengan filter ini.</div>`;
    }
    document.getElementById("lb-list-container").innerHTML = listHtml;
}

function tampilTanggal() { document.getElementById("tanggalMonitor").innerText = currentDate.toLocaleDateString("id-ID", { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }); }
function updatePilarPoin(pilar, val) { let hari = getHariIni(); hari.pilar[pilar] = val; hari.poin = Object.values(hari.pilar).reduce((a, b) => a + b, 0); document.getElementById("totalPoin").innerText = hari.poin; syncToFirebase(); }

function catatBangun() { 
    let hari = getHariIni(); 
    if (hari.bangun) { showToast("✅ Aktivitas sudah diisi."); return; }
    if (hari.tidur_val) { showToast("🔒 Terkunci tidak bisa diisi karena sudah tidur."); return; }

    let jamMenit = new Date().getHours() + (new Date().getMinutes()/60); 
    let jamString = new Date().toLocaleTimeString("id-ID", {hour:'2-digit', minute:'2-digit'}); 
    hari.bangun = jamString; 

    if (jamMenit >= 3.0 && jamMenit <= 5.0) { 
        updatePilarPoin('bangun', 20); showToast("☀️ Bangun pagi tepat waktu! <strong>+20 Poin</strong>"); 
    } else { 
        updatePilarPoin('bangun', 0); showToast("⚠️ Kamu bangun pukul " + jamString + ". Usahakan lebih pagi! <strong>(0 Poin)</strong>"); 
    } 
    loadKebiasaan(); 
}

function checkSholat(nama, mulai, akhir) { 
    let hari = getHariIni(); 
    if (hari.tidur_val) {
        showToast("⚠️ Waktu sholat " + nama + " telah usai.");
        return;
    }

    let jamSekarang = new Date().getHours().toString().padStart(2, '0') + ":" + new Date().getMinutes().toString().padStart(2, '0'); 
    if (jamSekarang >= mulai && jamSekarang <= akhir) { 
        hari['sholat_'+nama] = true; 
        updatePilarPoin('sholat', (hari.pilar.sholat || 0) + 10); 
        showToast("✅ Alhamdulillah sudah sholat " + nama + "! <strong>+10 Poin</strong>"); 
        loadKebiasaan(); 
    } else { 
        showToast("⚠️ Waktu sholat " + nama + " belum dimulai."); 
    } 
}

function simpanInput(pilar) {
    let hari = getHariIni(); 
    if (hari.inputs[pilar]) { showToast("✅ Aktivitas sudah diisi."); return; }
    if (hari.tidur_val) { showToast("🔒 Terkunci tidak bisa diisi karena sudah tidur."); return; }
    
    let text = document.getElementById("input-" + pilar).value.trim();
    if (!text) { showToast("⚠️ Harap isi deskripsi aktivitas terlebih dahulu."); return; }
    
    hari.inputs[pilar] = text;

    let poinDasar = (text.length > 0 && text.length < 20) ? 1 : Math.min(Math.floor(text.length / 20) * 10, 30);
    let bonus = 0; let t = text.toLowerCase(); 
    switch (pilar) { case 'olahraga': if (/(sepak bola|lari|sepeda|renang|basket|voli|senam)/i.test(t)) bonus = 5; break; case 'makan': if (/(susu|sayur|buah|air putih|daging|ikan|telur)/i.test(t)) bonus = 5; break; case 'belajar': if (/(ipa|mtk|matematika|ips|bahasa|agama|sejarah|inggris)/i.test(t)) bonus = 15; break; case 'masyarakat': if (/(ayah|ibu|teman)/i.test(t) || /[A-Z]/.test(text)) bonus = 10; break; }
    
    let totalPoin = poinDasar + bonus; 
    updatePilarPoin(pilar, totalPoin); 
    
    showToast("✅ Aktivitas berhasil disimpan! <strong>+" + totalPoin + " Poin</strong>"); 
    loadKebiasaan(); 
}

function catatTidur() { 
    let hari = getHariIni(); 
    if (hari.tidur_val) { showToast("✅ Aktivitas sudah diisi."); return; }
    
    if (!hari['sholat_Isya']) { 
        showToast("⚠️ <strong>Belum sholat Isya!</strong><br>Harus diselesaikan sebelum tidur."); 
        return; 
    } 
    
    let isOlahragaFilled = !!hari.inputs.olahraga;
    let isMakanFilled = !!hari.inputs.makan;
    let isBelajarFilled = !!hari.inputs.belajar;
    let isMasyarakatFilled = !!hari.inputs.masyarakat;
    
    if (isOlahragaFilled && isMakanFilled && isBelajarFilled && isMasyarakatFilled) {
        prosesCatatTidur();
    } else {
        document.getElementById("confirmToast").classList.add("show");
        document.getElementById("overlay").classList.add("show");
    }
}

function confirmSleep(isYes) {
    document.getElementById("confirmToast").classList.remove("show");
    document.getElementById("overlay").classList.remove("show");

    if (isYes) {
        prosesCatatTidur();
    } else {
        showToast("Aksi mencatat waktu tidur dibatalkan.");
    }
}

function prosesCatatTidur() {
    let hari = getHariIni(); 
    let jamMenit = new Date().getHours() + (new Date().getMinutes()/60); 
    let jamString = new Date().toLocaleTimeString("id-ID", {hour:'2-digit', minute:'2-digit'}); 
    hari.tidur_val = jamString; 
    
    let p = jamMenit < 20.0 ? 20 : (jamMenit < 21.0 ? 10 : (jamMenit <= 22.0 ? 5 : 0)); 
    updatePilarPoin('tidur', p); 
    
    if (p > 0) {
        showToast("🌙 <strong>Selamat beristirahat!</strong><br>Semua aktivitas terkunci. +" + p + " Poin"); 
    } else {
        showToast("⚠️ <strong>Tidur terlalu larut malam!</strong><br>Semua aktivitas terkunci. (0 Poin)"); 
    }
    
    loadKebiasaan();
}

function loadKebiasaan() {
    let hari = getHariIni(); 
    let jamSekarang = new Date().getHours().toString().padStart(2, '0') + ":" + new Date().getMinutes().toString().padStart(2, '0');
    
    let isTidur = !!hari.tidur_val; 

    let clsBangun = (hari.bangun || isTidur) ? "btn-disabled" : "";
    let clsTidur = hari.tidur_val ? "btn-disabled" : "";
    
    let isOlahragaLocked = isTidur || !!hari.inputs.olahraga;
    let clsOlahraga = isOlahragaLocked ? "btn-disabled" : "";
    let attrOlahraga = isOlahragaLocked ? `readonly class="locked-input" onclick="showToast('${hari.inputs.olahraga ? '✅ Aktivitas sudah diisi.' : '🔒 Terkunci tidak bisa diisi karena sudah tidur.'}')"` : '';

    let isMakanLocked = isTidur || !!hari.inputs.makan;
    let clsMakan = isMakanLocked ? "btn-disabled" : "";
    let attrMakan = isMakanLocked ? `readonly class="locked-input" onclick="showToast('${hari.inputs.makan ? '✅ Aktivitas sudah diisi.' : '🔒 Terkunci tidak bisa diisi karena sudah tidur.'}')"` : '';

    let isBelajarLocked = isTidur || !!hari.inputs.belajar;
    let clsBelajar = isBelajarLocked ? "btn-disabled" : "";
    let attrBelajar = isBelajarLocked ? `readonly class="locked-input" onclick="showToast('${hari.inputs.belajar ? '✅ Aktivitas sudah diisi.' : '🔒 Terkunci tidak bisa diisi karena sudah tidur.'}')"` : '';

    let isMasyarakatLocked = isTidur || !!hari.inputs.masyarakat;
    let clsMasyarakat = isMasyarakatLocked ? "btn-disabled" : "";
    let attrMasyarakat = isMasyarakatLocked ? `readonly class="locked-input" onclick="showToast('${hari.inputs.masyarakat ? '✅ Aktivitas sudah diisi.' : '🔒 Terkunci tidak bisa diisi karena sudah tidur.'}')"` : '';
    
    let html = `
        <div class="card">
            <h3>☀️ 1. Bangun Pagi <span class="point-tag">${hari.pilar.bangun} Poin</span></h3>
            <button class="primary ${clsBangun}" onclick="catatBangun()">
                ${hari.bangun ? "Aktivitas sudah diisi" : (isTidur ? "Sudah Tidur" : "Catat Waktu Bangun")}
            </button>
            <div class="badge">${hari.bangun ? "Jam: " + hari.bangun : "Belum diisi"}</div>
        </div>
        
        <div class="card">
            <h3>🙏 2. Beribadah <span class="point-tag">${hari.pilar.sholat} Poin</span></h3>
            <div style="display: flex; flex-wrap: wrap; gap: 5px; margin-top:10px">
            ${Object.keys(jadwalSholat).map(s => { 
                let done = hari['sholat_'+s]; 
                let m = jadwalSholat[s].mulai; 
                let a = jadwalSholat[s].akhir; 
                let lewat = jamSekarang > a; 
                let wkt = jamSekarang >= m && jamSekarang <= a; 
                
                let bg = '#f1f5f9'; let textColor = '#94a3b8'; let icon = '&nbsp;'; let action = ''; 
                
                if (done) { 
                    bg = 'var(--primary)'; textColor = 'white'; icon = '✓'; 
                    action = `showToast('✅ Alhamdulillah sudah sholat ${s}.')`;
                } else if (lewat || isTidur) {
                    bg = 'var(--danger)'; textColor = 'white'; icon = '✕'; 
                    action = `showToast('⚠️ Waktu sholat ${s} telah usai.')`;
                } else if (wkt) { 
                    bg = '#3498db'; textColor = 'white'; icon = 'Mulai'; 
                    action = `checkSholat('${s}','${m}','${a}')`;
                } else {
                    action = `showToast('⚠️ Waktu sholat ${s} belum dimulai.')`;
                } 
                
                return `<button style="flex:1; border:none; padding:8px 0; background:${bg}; color:${textColor}; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:2px; margin:0; border-radius:12px; cursor:pointer;" onclick="${action}">
                    <span style="font-size:0.75rem; font-weight:800;">${s}</span>
                    <span style="font-size:0.9rem; font-weight:900;">${icon}</span>
                </button>`; 
            }).join('')}
            </div>
        </div>

        <div class="card">
            <h3>⚽ 3. Berolahraga <span class="point-tag">${hari.pilar.olahraga} Poin</span></h3>
            <textarea id="input-olahraga" placeholder="${isTidur && !hari.inputs.olahraga ? 'Terkunci tidak bisa diisi karena sudah tidur.' : 'Olahraga apa yang kamu lakukan hari ini?'}" ${attrOlahraga}>${hari.inputs.olahraga}</textarea>
            <button class="primary ${clsOlahraga}" style="margin-top:8px; padding:10px;" onclick="simpanInput('olahraga')">${hari.inputs.olahraga ? "Aktivitas sudah diisi" : (isTidur ? "Sudah Tidur" : "Simpan Aktivitas")}</button>
        </div>

        <div class="card">
            <h3>🥗 4. Makan Sehat <span class="point-tag">${hari.pilar.makan} Poin</span></h3>
            <textarea id="input-makan" placeholder="${isTidur && !hari.inputs.makan ? 'Terkunci tidak bisa diisi karena sudah tidur.' : 'Makanan sehat apa yang kamu konsumsi hari ini?'}" ${attrMakan}>${hari.inputs.makan}</textarea>
            <button class="primary ${clsMakan}" style="margin-top:8px; padding:10px;" onclick="simpanInput('makan')">${hari.inputs.makan ? "Aktivitas sudah diisi" : (isTidur ? "Sudah Tidur" : "Simpan Aktivitas")}</button>
        </div>

        <div class="card">
            <h3>💡 5. Gemar Belajar <span class="point-tag">${hari.pilar.belajar} Poin</span></h3>
            <textarea id="input-belajar" placeholder="${isTidur && !hari.inputs.belajar ? 'Terkunci tidak bisa diisi karena sudah tidur.' : 'Apa yang kamu pelajari hari ini?'}" ${attrBelajar}>${hari.inputs.belajar}</textarea>
            <button class="primary ${clsBelajar}" style="margin-top:8px; padding:10px;" onclick="simpanInput('belajar')">${hari.inputs.belajar ? "Aktivitas sudah diisi" : (isTidur ? "Sudah Tidur" : "Simpan Aktivitas")}</button>
        </div>

        <div class="card">
            <h3>🤝 6. Bermasyarakat <span class="point-tag">${hari.pilar.masyarakat} Poin</span></h3>
            <textarea id="input-masyarakat" placeholder="${isTidur && !hari.inputs.masyarakat ? 'Terkunci tidak bisa diisi karena sudah tidur.' : 'Kegiatan sosial apa yang kamu lakukan hari ini?'}" ${attrMasyarakat}>${hari.inputs.masyarakat}</textarea>
            <button class="primary ${clsMasyarakat}" style="margin-top:8px; padding:10px;" onclick="simpanInput('masyarakat')">${hari.inputs.masyarakat ? "Aktivitas sudah diisi" : (isTidur ? "Sudah Tidur" : "Simpan Aktivitas")}</button>
        </div>

        <div class="card">
            <h3>🌙 7. Tidur Cepat <span class="point-tag">${hari.pilar.tidur} Poin</span></h3>
            <button class="primary ${clsTidur}" style="background:${hari.tidur_val ? '#cbd5e1' : '#6c5ce7'}" onclick="catatTidur()">${hari.tidur_val ? "Aktivitas sudah diisi" : "Catat Waktu Tidur"}</button>
            <div class="badge">${hari.tidur_val ? "Jam: " + hari.tidur_val : "Belum diisi"}</div>
        </div>
    `;
    document.getElementById("listKebiasaan").innerHTML = html; document.getElementById("totalPoin").innerText = hari.poin;
}

function updateView() {
    let mode = document.getElementById("filterWaktu").value; let dateInput = document.getElementById("filterTanggal"); dateInput.style.display = (mode === 'harian') ? "inline-block" : "none";
    let allKeys = Object.keys(data).sort((a, b) => new Date(b) - new Date(a)); let selectedKeys = [];
    if (mode === 'harian') { if(allKeys.includes(dateInput.value)) selectedKeys.push(dateInput.value); } else if (mode === 'mingguan') { selectedKeys = allKeys.slice(0, 7); } else if (mode === 'bulanan') { selectedKeys = allKeys.slice(0, 30); }
    renderGrafik(selectedKeys); renderEvaluasi(selectedKeys); renderRiwayat(selectedKeys);
}

function renderGrafik(keysArr) {
    let labels = []; let poinData = []; keysArr.slice().reverse().forEach(k => { labels.push(k.split('-')[2]); let h = data[k][currentUser]; poinData.push(h ? h.poin : 0); });
    if (chart) chart.destroy(); chart = new Chart(document.getElementById("chart"), { type: "bar", data: { labels: labels, datasets: [{ label: "Total Poin", data: poinData, backgroundColor: "#1db954", borderRadius: 5 }] }, options: { scales: { y: { beginAtZero: true } }, animation: {duration: 500} } });
}

function renderEvaluasi(keysArr) {
    let box = document.getElementById("evaluasiText"); if (keysArr.length === 0) { box.innerHTML = "<em>Belum ada riwayat aktivitas.</em>"; return; }
    let totalPoin = 0; let missedSholat = 0; let badSleep = 0; let noSports = 0; let validDays = 0;
    keysArr.forEach(k => { let h = data[k][currentUser]; if (!h) return; validDays++; totalPoin += h.poin; if (!h.sholat_Subuh || !h.sholat_Dzuhur || !h.sholat_Ashar || !h.sholat_Maghrib || !h.sholat_Isya) missedSholat++; if (h.pilar.tidur === 0 && h.tidur_val) badSleep++; if (!h.inputs.olahraga || h.pilar.olahraga === 0) noSports++; });
    let avgPoin = Math.round(totalPoin / validDays); let htmlEval = `<ul><li><strong>Rata-rata Kinerja:</strong> ${avgPoin} Poin/Hari. `;
    if (avgPoin >= 100) htmlEval += `🌟 Kinerja sangat baik.</li>`; else if (avgPoin >= 50) htmlEval += `👍 Kinerja cukup baik, terus tingkatkan.</li>`; else htmlEval += `⚠️ Perlu peningkatan dalam mengumpulkan poin.</li>`;
    if (missedSholat > 0) htmlEval += `<li>🕌 Terdapat ibadah sholat yang belum lengkap pada ${missedSholat} hari.</li>`; else htmlEval += `<li>🕌 Ibadah sholat selalu lengkap, pertahankan.</li>`;
    if (badSleep > 0) htmlEval += `<li>🌙 Kamu tidur terlalu larut pada ${badSleep} hari.</li>`; if (noSports > 0) htmlEval += `<li>⚽ Kamu belum mencatat aktivitas olahraga pada ${noSports} hari.</li>`;
    htmlEval += `</ul>`; box.innerHTML = htmlEval;
}

function renderRiwayat(keysArr) {
    let historyHtml = ``;
    if(keysArr.length === 0) { historyHtml += `<p style="font-size:0.9rem; color:#64748b; text-align:center;">Belum ada riwayat aktivitas.</p>`; } else {
        historyHtml += `<table class="history-table"><tr><th style="width:20%">Tanggal</th><th style="width:15%">Poin</th><th>Aktivitas</th></tr>`;
        keysArr.forEach(k => {
            let h = data[k][currentUser]; if (!h) return; let details = [];
            if(h.bangun) details.push(`<strong>☀️ Bangun:</strong> ${h.bangun}`);
            let sholatDone = []; ['Subuh', 'Dzuhur', 'Ashar', 'Maghrib', 'Isya'].forEach(s => { if(h['sholat_'+s]) sholatDone.push(s); }); if(sholatDone.length > 0) details.push(`<strong>🙏 Ibadah:</strong> ${sholatDone.join(', ')}`);
            if(h.inputs.olahraga) details.push(`<strong>⚽ Olahraga:</strong> "${h.inputs.olahraga}"`); if(h.inputs.makan) details.push(`<strong>🥗 Makan:</strong> "${h.inputs.makan}"`); if(h.inputs.belajar) details.push(`<strong>💡 Belajar:</strong> "${h.inputs.belajar}"`); if(h.inputs.masyarakat) details.push(`<strong>🤝 Masyarakat:</strong> "${h.inputs.masyarakat}"`); if(h.tidur_val) details.push(`<strong>🌙 Tidur:</strong> ${h.tidur_val}`);
            historyHtml += `<tr><td style="white-space:nowrap; font-weight:bold;">${new Date(k).toLocaleDateString("id-ID", { day: 'numeric', month: 'short' })}</td><td style="font-weight:900; color:var(--primary); font-size:1.1rem; text-align:center">${h.poin}</td><td class="detail-teks">${details.length > 0 ? details.join('<br>') : '<span style="color:var(--danger)">Kosong</span>'}</td></tr>`;
        });
        historyHtml += `</table>`;
    }
    document.getElementById("historyContainer").innerHTML = historyHtml;
}


window.onload = function() {
    let u = localStorage.getItem("jurusku_user"); 
    let p = localStorage.getItem("jurusku_pass");

    if (u && p) { 
        document.getElementById("username").value = u; 
        document.getElementById("password").value = p; 
        login(); 
    } else {
        document.getElementById("loginPage").style.display = "block";
    }
}