// DURUM YÖNETİMİ
const App = {
    db: {
        teachers: [],
        students: [],
        announcements: [],
        activities: [],
        juzRecords: []
    },
    currentTeacher: null,

    init() {
        this.loadLocalData();
        this.checkAuth();
        UI.updateDate();
        setInterval(UI.updateDate, 60000);
    },

    save() {
        localStorage.setItem('onur_emek_v2_db', JSON.stringify(this.db));
        UI.refreshAll();
    },

    loadLocalData() {
        const data = localStorage.getItem('onur_emek_v2_db');
        if (data) this.db = JSON.parse(data);
    },

    checkAuth() {
        const saved = localStorage.getItem('onur_emek_session');
        if (saved) {
            this.currentTeacher = JSON.parse(saved);
            UI.showApp();
        }
    },

    handleRegister() {
        const name = document.getElementById('reg-name').value;
        const user = document.getElementById('reg-username').value;
        const pass = document.getElementById('reg-password').value;

        if (!name || !user || !pass) return UI.toast("Boş alan bırakmayın!", "error");
        
        this.db.teachers.push({ name, user, pass });
        this.save();
        UI.toast("Başarıyla kayıt oldunuz.");
        UI.toggleAuth(false);
    },

    handleLogin() {
        const user = document.getElementById('login-username').value;
        const pass = document.getElementById('login-password').value;

        const teacher = this.db.teachers.find(t => t.user === user && t.pass === pass);
        if (teacher) {
            this.currentTeacher = teacher;
            localStorage.setItem('onur_emek_session', JSON.stringify(teacher));
            UI.showApp();
            UI.toast("Hoş geldiniz, " + teacher.name);
        } else {
            UI.toast("Hatalı bilgiler!", "error");
        }
    },

    logout() {
        localStorage.removeItem('onur_emek_session');
        location.reload();
    },

    addStudent() {
        const name = document.getElementById('new-std-name').value;
        if (!name) return;

        const std = {
            id: Date.now(),
            name,
            birth: document.getElementById('new-std-birth').value,
            completedJuz: 0,
            addedBy: this.currentTeacher.name
        };

        this.db.students.push(std);
        this.logActivity(`${name} isimli öğrenci eklendi.`);
        this.save();
        UI.hideModal('modal-student');
        document.getElementById('new-std-name').value = "";
    },

    assignJuz() {
        const stdId = document.getElementById('juz-select-student').value;
        const num = document.getElementById('juz-number').value;
        const student = this.db.students.find(s => s.id == stdId);

        if (!num || !student) return UI.toast("Eksik bilgi!");

        this.db.juzRecords.unshift({
            id: Date.now(),
            studentId: stdId,
            studentName: student.name,
            juz: num,
            status: 'Okuyor',
            date: new Date().toLocaleDateString('tr-TR')
        });

        this.logActivity(`${student.name} için ${num}. cüz başlatıldı.`);
        this.save();
    },

    completeJuz(id) {
        const record = this.db.juzRecords.find(r => r.id === id);
        if (record) {
            record.status = 'Tamamlandı';
            const std = this.db.students.find(s => s.id == record.studentId);
            if (std) std.completedJuz++;
            this.logActivity(`${record.studentName} ${record.juz}. cüzü bitirdi.`);
            this.save();
        }
    },

    addAnnouncement() {
        const title = document.getElementById('ann-title').value;
        const msg = document.getElementById('ann-msg').value;
        if (!title || !msg) return;

        this.db.announcements.unshift({
            title, msg, 
            teacher: this.currentTeacher.name,
            date: new Date().toLocaleDateString('tr-TR')
        });
        this.save();
        UI.toast("Duyuru yayınlandı.");
        document.getElementById('ann-title').value = "";
        document.getElementById('ann-msg').value = "";
    },

    logActivity(text) {
        this.db.activities.unshift({ text, time: new Date().toLocaleTimeString('tr-TR') });
        if (this.db.activities.length > 10) this.db.activities.pop();
    }
};

// ARAYÜZ YÖNETİMİ
const UI = {
    showApp() {
        document.getElementById('auth-wrapper').classList.add('hidden');
        document.getElementById('app-wrapper').classList.remove('hidden');
        document.getElementById('display-teacher-name').innerText = App.currentTeacher.name;
        this.refreshAll();
    },

    toggleAuth(toRegister) {
        document.getElementById('login-form').classList.toggle('hidden', toRegister);
        document.getElementById('register-form').classList.toggle('hidden', !toRegister);
        document.getElementById('auth-subtitle').innerText = toRegister ? "Hoca Kayıt Formu" : "Hoca Yönetim Paneli";
    },

    switchTab(tabId, el) {
        document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.nav-links li').forEach(l => l.classList.remove('active'));
        document.getElementById('tab-' + tabId).classList.add('active');
        el.classList.add('active');
        document.getElementById('page-title').innerText = el.querySelector('span').innerText;
    },

    refreshAll() {
        // İstatistikler
        document.getElementById('count-students').innerText = App.db.students.length;
        let totalJuz = 0;
        App.db.students.forEach(s => totalJuz += s.completedJuz);
        document.getElementById('count-juz').innerText = totalJuz;

        // Timeline
        document.getElementById('timeline').innerHTML = App.db.activities.map(a => `
            <div class="list-item" style="font-size:13px">
                <span>${a.text}</span>
                <small>${a.time}</small>
            </div>
        `).join('');

        // Öğrenci Listesi
        document.getElementById('student-grid').innerHTML = App.db.students.map(s => `
            <div class="card glass">
                <h4>${s.name}</h4>
                <div class="progress-bar"><div style="width:${(s.completedJuz/30)*100}%"></div></div>
                <small>${s.completedJuz}/30 Cüz Tamamlandı</small>
            </div>
        `).join('');

        // Cüz Listesi
        document.getElementById('juz-container').innerHTML = App.db.juzRecords.map(r => `
            <div class="list-item">
                <div><b>${r.studentName}</b><br><small>${r.juz}. Cüz - ${r.date}</small></div>
                ${r.status === 'Okuyor' ? `<button class="btn-small" onclick="App.completeJuz(${r.id})">Bitir</button>` : `<span style="color:var(--primary)">✓</span>`}
            </div>
        `).join('');

        // Select Update
        document.getElementById('juz-select-student').innerHTML = App.db.students.map(s => `<option value="${s.id}">${s.name}</option>`).join('');

        // Duyurular
        document.getElementById('ann-container').innerHTML = App.db.announcements.map(a => `
            <div class="card glass">
                <h3>${a.title}</h3>
                <p>${a.msg}</p>
                <small>${a.teacher} • ${a.date}</small>
            </div>
        `).join('');
    },

    showModal(id) { document.getElementById(id).style.display = 'flex'; },
    hideModal(id) { document.getElementById(id).style.display = 'none'; },

    toast(msg, type = "success") {
        const t = document.createElement('div');
        t.className = `toast ${type}`;
        t.innerText = msg;
        document.getElementById('toast-container').appendChild(t);
        setTimeout(() => t.remove(), 3000);
    },

    updateDate() {
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        document.getElementById('current-date').innerText = new Date().toLocaleDateString('tr-TR', options);
    }
};

App.init();
