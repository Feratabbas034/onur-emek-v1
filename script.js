// --- VERİ YÖNETİMİ ---
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

// Uygulama Açıldığında Çalışır
window.onload = () => {
    loadData();
    checkLoginStatus();
};

// Verileri Telefona Kaydet/Yükle (Local Storage)
function loadData() {
    const localData = localStorage.getItem('onur_emek_db');
    if (localData) {
        db = JSON.parse(localData);
        // Eksik dizileri tanımla (Hata önleyici)
        if (!db.teachers) db.teachers = [];
        if (!db.students) db.students = [];
        if (!db.announcements) db.announcements = [];
        if (!db.juzRecords) db.juzRecords = [];
        if (!db.activities) db.activities = [];
    }
}

function saveData() {
    localStorage.setItem('onur_emek_db', JSON.stringify(db));
    updateDashboard();
    renderAll();
}

// --- GİRİŞ VE KAYIT İŞLEMLERİ ---
function toggleAuth() {
    document.getElementById('login-screen').classList.toggle('hidden');
    document.getElementById('register-screen').classList.toggle('hidden');
}

function authAction(type) {
    if (type === 'register') {
        const name = document.getElementById('reg-name').value;
        const user = document.getElementById('reg-username').value;
        const pass = document.getElementById('reg-password').value;

        if (!name || !user || !pass) {
            alert("Lütfen tüm alanları doldurun!");
            return;
        }
        
        // Kullanıcı var mı kontrolü
        const exists = db.teachers.find(t => t.user === user);
        if(exists) return alert("Bu kullanıcı adı zaten alınmış!");

        db.teachers.push({ name, user, pass });
        saveData();
        alert("Hoca kaydı başarılı! Giriş yapabilirsiniz.");
        toggleAuth(); // Giriş ekranına döner
    } else {
        const user = document.getElementById('username').value;
        const pass = document.getElementById('password').value;

        const teacher = db.teachers.find(t => t.user === user && t.pass === pass);
        if (teacher) {
            currentTeacher = teacher;
            localStorage.setItem('logged_teacher', JSON.stringify(teacher));
            showDashboard();
        } else {
            alert("Hatalı kullanıcı adı veya şifre!");
        }
    }
}

function checkLoginStatus() {
    const saved = localStorage.getItem('logged_teacher');
    if (saved) {
        currentTeacher = JSON.parse(saved);
        showDashboard();
    }
}

function logout() {
    localStorage.removeItem('logged_teacher');
    location.reload();
}

// --- PANEL GÖSTERİMİ ---
function showDashboard() {
    document.getElementById('login-screen').classList.add('hidden');
    document.getElementById('register-screen').classList.add('hidden');
    document.getElementById('main-panel').classList.remove('hidden');
    document.getElementById('teacher-name').innerText = currentTeacher.name;
    updateDashboard();
    renderAll();
}

function showSection(sectionId) {
    // Tüm bölümleri gizle
    document.querySelectorAll('.section').forEach(s => s.classList.add('hidden'));
    // Seçilen bölümü aç
    const target = document.getElementById('section-' + sectionId);
    if(target) target.classList.remove('hidden');
    renderAll();
}

// --- ÖĞRENCİ VE CÜZ İŞLEMLERİ ---
function addStudent() {
    const name = document.getElementById('std-name').value;
    if (!name) return alert("Öğrenci adı yazın!");

    db.students.push({
        id: Date.now(),
        name: name,
        completedJuz: 0,
        status: "Aktif"
    });
    
    addActivity(`${name} isimli öğrenci eklendi.`);
    saveData();
    document.getElementById('std-name').value = "";
}

function assignJuz() {
    const stdId = document.getElementById('juz-student-select').value;
    const juzNo = document.getElementById('juz-no').value;
    const student = db.students.find(s => s.id == stdId);

    if (!juzNo || !student) return alert("Lütfen öğrenci seçin ve cüz no yazın!");

    db.juzRecords.unshift({
        id: Date.now(),
        studentName: student.name,
        juzNo: juzNo,
        status: "Okuyor",
        date: new Date().toLocaleDateString('tr-TR')
    });

    addActivity(`${student.name} isimli öğrenciye ${juzNo}. Cüz verildi.`);
    saveData();
}

function completeJuz(id) {
    const record = db.juzRecords.find(r => r.id === id);
    if (record) {
        record.status = "Tamamlandı";
        const student = db.students.find(s => s.name === record.studentName);
        if (student) student.completedJuz += 1;
        addActivity(`${record.studentName}, ${record.juzNo}. Cüzü bitirdi.`);
        saveData();
    }
}

// --- DUYURU SİSTEMİ ---
function addAnnouncement() {
    const title = document.getElementById('ann-title').value;
    const msg = document.getElementById('ann-msg').value;

    if (!title || !msg) return alert("Duyuru içeriği boş olamaz!");

    db.announcements.unshift({
        id: Date.now(),
        title,
        msg,
        teacher: currentTeacher.name,
        date: new Date().toLocaleDateString('tr-TR')
    });

    saveData();
    document.getElementById('ann-title').value = "";
    document.getElementById('ann-msg').value = "";
}

// --- DİĞER ---
function addActivity(text) {
    db.activities.unshift({ text, time: new Date().toLocaleTimeString('tr-TR') });
    if (db.activities.length > 5) db.activities.pop();
}

function updateDashboard() {
    document.getElementById('stat-students').innerText = db.students.length;
    let total = 0;
    db.students.forEach(s => total += s.completedJuz);
    document.getElementById('stat-juz').innerText = total;
}

function renderAll() {
    // Öğrenci listesi
    const stdList = document.getElementById('student-list');
    if (stdList) {
        stdList.innerHTML = db.students.map(s => `
            <div class="list-item">
                <span>${s.name}</span>
                <span>${s.completedJuz} Cüz</span>
            </div>
        `).join('');
    }

    // Cüz listesi
    const juzList = document.getElementById('juz-list');
    if (juzList) {
        juzList.innerHTML = db.juzRecords.map(j => `
            <div class="list-item">
                <div>${j.studentName} - <b>${j.juzNo}. Cüz</b></div>
                ${j.status === 'Okuyor' ? `<button style="width:auto; padding:5px 10px;" onclick="completeJuz(${j.id})">Bitir</button>` : `<span style="color:var(--primary)">Tamamlandı</span>`}
            </div>
        `).join('');
    }

    // Duyurular
    const annList = document.getElementById('ann-list');
    if (annList) {
        annList.innerHTML = db.announcements.map(a => `
            <div class="card" style="border: 1px solid #444;">
                <h4>${a.title}</h4>
                <p>${a.msg}</p>
                <small>${a.teacher} - ${a.date}</small>
            </div>
        `).join('');
    }

    // Öğrenci seçme kutusu (Cüz atama için)
    const select = document.getElementById('juz-student-select');
    if (select) {
        select.innerHTML = db.students.map(s => `<option value="${s.id}">${s.name}</option>`).join('');
    }
}
