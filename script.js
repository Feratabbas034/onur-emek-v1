// --- AYARLAR VE VERİTABANI BAĞLANTISI ---
// Not: Gerçek senkronizasyon için JSONbin.io hesabı açıp burayı güncellemelisin.
const API_URL = "https://api.jsonbin.io/v3/b/69b47dc46887921da853ab2b"; // Kendi Bin ID'nizi buraya yazın
const API_KEY = "$2a$10$fk0NsmcqelSKej1D9LVuR.ds2SVQTRpd/TdDddzWfJ8qc7wS161.K"; // Kendi API Key'inizi buraya yazın

let db = {
    teachers: [],
    students: [],
    announcements: [],
    juzRecords: [],
    memoTests: [],
    lessons: [],
    activities: []
};

let currentTeacher = null;

// --- UYGULAMA BAŞLATMA ---
window.onload = async () => {
    await loadData();
    checkLoginStatus();
};

// Verileri Buluttan Çek
async function loadData() {
    try {
        const response = await fetch(`${API_URL}/latest`, {
            headers: { "X-Master-Key": API_KEY }
        });
        const result = await response.json();
        db = result.record;
        console.log("Veriler yüklendi:", db);
    } catch (error) {
        console.error("Veri yükleme hatası:", error);
        // Hata durumunda yerel depolamayı dene
        const local = localStorage.getItem('onur_emek_backup');
        if (local) db = JSON.parse(local);
    }
}

// Verileri Buluta Kaydet
async function saveData() {
    localStorage.setItem('onur_emek_backup', JSON.stringify(db));
    try {
        await fetch(API_URL, {
            method: 'PUT',
            headers: {
                "Content-Type": "application/json",
                "X-Master-Key": API_KEY
            },
            body: JSON.stringify(db)
        });
        updateDashboard();
        renderAll();
    } catch (error) {
        console.error("Kayıt hatası:", error);
    }
}

// --- KİMLİK DOĞRULAMA (AUTH) ---
function checkLoginStatus() {
    const saved = localStorage.getItem('logged_teacher');
    if (saved) {
        currentTeacher = JSON.parse(saved);
        showDashboard();
    }
}

function authAction(type) {
    if (type === 'register') {
        const name = document.getElementById('reg-name').value;
        const user = document.getElementById('reg-username').value;
        const pass = document.getElementById('reg-password').value;

        if (!name || !user || !pass) return alert("Lütfen tüm alanları doldurun!");
        
        db.teachers.push({ name, user, pass });
        saveData();
        alert("Kayıt başarılı! Şimdi giriş yapabilirsiniz.");
        toggleAuth();
    } else {
        const user = document.getElementById('username').value;
        const pass = document.getElementById('password').value;

        const teacher = db.teachers.find(t => t.user === user && t.pass === pass);
        if (teacher) {
            currentTeacher = teacher;
            localStorage.setItem('logged_teacher', JSON.stringify(teacher));
            showDashboard();
        } else {
            alert("Kullanıcı adı veya şifre hatalı!");
        }
    }
}

function logout() {
    localStorage.removeItem('logged_teacher');
    location.reload();
}

function toggleAuth() {
    document.getElementById('login-screen').classList.toggle('hidden');
    document.getElementById('register-screen').classList.toggle('hidden');
}

// --- PANEL YÖNETİMİ ---
function showDashboard() {
    document.getElementById('login-screen').classList.add('hidden');
    document.getElementById('register-screen').classList.add('hidden');
    document.getElementById('main-panel').classList.remove('hidden');
    document.getElementById('teacher-name').innerText = currentTeacher.name;
    updateDashboard();
}

function showSection(sectionId) {
    document.querySelectorAll('.section').forEach(s => s.classList.add('hidden'));
    document.getElementById('section-' + sectionId).classList.remove('hidden');
    renderAll();
}

// --- ÖĞRENCİ YÖNETİMİ ---
function addStudent() {
    const name = document.getElementById('std-name').value;
    const birth = document.getElementById('std-birth').value;
    if (!name) return;

    const newStudent = {
        id: Date.now(),
        name,
        birth,
        completedJuz: 0,
        status: "Aktif",
        progress: 0
    };

    db.students.push(newStudent);
    addActivity(`${currentTeacher.name}, yeni bir öğrenci ekledi: ${name}`);
    saveData();
    document.getElementById('std-name').value = "";
}

// --- CÜZ TAKİP SİSTEMİ ---
function assignJuz() {
    const stdId = document.getElementById('juz-student-select').value;
    const juzNo = document.getElementById('juz-no').value;
    const student = db.students.find(s => s.id == stdId);

    if (!juzNo || !student) return alert("Bilgileri kontrol edin!");

    const record = {
        id: Date.now(),
        studentName: student.name,
        teacherName: currentTeacher.name,
        juzNo: juzNo,
        pages: 0,
        status: "Okuyor",
        date: new Date().toLocaleDateString('tr-TR')
    };

    db.juzRecords.unshift(record);
    addActivity(`${student.name} isimli öğrenciye ${juzNo}. Cüz atandı.`);
    saveData();
}

function completeJuz(id) {
    const record = db.juzRecords.find(r => r.id === id);
    if (record) {
        record.status = "Tamamlandı";
        const student = db.students.find(s => s.name === record.studentName);
        if (student) student.completedJuz += 1;
        addActivity(`${record.studentName}, ${record.juzNo}. Cüzü tamamladı!`);
        saveData();
    }
}

// --- DUYURU SİSTEMİ ---
function addAnnouncement() {
    const title = document.getElementById('ann-title').value;
    const msg = document.getElementById('ann-msg').value;

    if (!title || !msg) return;

    db.announcements.unshift({
        id: Date.now(),
        title,
        msg,
        teacher: currentTeacher.name,
        date: new Date().toLocaleDateString('tr-TR')
    });

    addActivity(`Yeni duyuru: ${title}`);
    saveData();
    document.getElementById('ann-title').value = "";
    document.getElementById('ann-msg').value = "";
}

function deleteAnnouncement(id) {
    db.announcements = db.announcements.filter(a => a.id !== id);
    saveData();
}

// --- EZBER TESTİ ---
function addMemoTest() {
    const name = document.getElementById('memo-student').value;
    const surah = document.getElementById('memo-surah').value;
    const result = document.getElementById('memo-result').value;

    db.memoTests.unshift({
        name, surah, result, teacher: currentTeacher.name, date: new Date().toLocaleDateString()
    });
    addActivity(`${name} için ${surah} suresi ezber testi yapıldı.`);
    saveData();
}

// --- AKTİVİTE VE İSTATİSTİK ---
function addActivity(text) {
    db.activities.unshift({
        text,
        time: new Date().toLocaleTimeString('tr-TR'),
        date: new Date().toLocaleDateString('tr-TR')
    });
    if (db.activities.length > 20) db.activities.pop();
}

function updateDashboard() {
    document.getElementById('stat-students').innerText = db.students.length;
    let total = 0;
    db.students.forEach(s => total += s.completedJuz);
    document.getElementById('stat-juz').innerText = total;

    // Timeline render
    const timeline = document.getElementById('activity-timeline');
    if(timeline) {
        timeline.innerHTML = db.activities.slice(0, 5).map(a => `
            <div class="activity-item">
                <small>${a.time}</small> - ${a.text}
            </div>
        `).join('');
    }
}

// --- LİSTELEME FONKSİYONLARI ---
function renderAll() {
    // Öğrenci Listesi
    const stdList = document.getElementById('student-list');
    if (stdList) {
        stdList.innerHTML = db.students.map(s => `
            <div class="list-item">
                <div><b>${s.name}</b><br><small>Biten: ${s.completedJuz} Cüz</small></div>
                <div class="badge">${s.status}</div>
            </div>
        `).join('');
    }

    // Duyuru Listesi
    const annList = document.getElementById('ann-list');
    if (annList) {
        annList.innerHTML = db.announcements.map(a => `
            <div class="card">
                <div style="display:flex; justify-content:space-between">
                    <h4>${a.title}</h4>
                    <button class="delete-btn" onclick="deleteAnnouncement(${a.id})">❌</button>
                </div>
                <p>${a.msg}</p>
                <small>${a.teacher} - ${a.date}</small>
            </div>
        `).join('');
    }

    // Cüz Listesi
    const juzList = document.getElementById('juz-list');
    if (juzList) {
        juzList.innerHTML = db.juzRecords.map(j => `
            <div class="list-item">
                <div>${j.studentName} - <b>${j.juzNo}. Cüz</b></div>
                ${j.status === 'Okuyor' ? `<button onclick="completeJuz(${j.id})">Bitir</button>` : `<span class="green">Tamamlandı</span>`}
            </div>
        `).join('');
    }

    // Liderlik Tablosu
    const leaderList = document.getElementById('leaderboard-list');
    if (leaderList) {
        const sorted = [...db.students].sort((a,b) => b.completedJuz - a.completedJuz);
        leaderList.innerHTML = sorted.map((s, index) => `
            <div class="list-item">
                <span>${index + 1}. ${s.name}</span>
                <span class="green"><b>${s.completedJuz} Cüz</b></span>
            </div>
        `).join('');
    }

    // Select kutularını güncelle
    const selects = ['juz-student-select', 'memo-student'];
    selects.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.innerHTML = db.students.map(s => `<option value="${s.id}">${s.name}</option>`).join('');
        }
    });
}
