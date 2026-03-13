const App = {

db: {
teachers: [],
students: [],
juzRecords: [],
memorization: [],
attendance: [],
announcements: [],
activities: []
},

currentTeacher: null,

init(){

this.loadData();
this.checkAuth();
UI.updateDate();
setInterval(UI.updateDate,60000);
UI.initCharts();

},

//----------------- DATABASE -----------------

save(){
localStorage.setItem('onur_emek_db',JSON.stringify(this.db));
UI.refreshAll();
},

loadData(){
const data = localStorage.getItem('onur_emek_db');
if(data) this.db = JSON.parse(data);
},

checkAuth(){
const saved = localStorage.getItem('onur_emek_session');
if(saved){
this.currentTeacher = JSON.parse(saved);
UI.showApp();
}
},

//----------------- AUTH -----------------

register(){
const name = document.getElementById('reg-name').value.trim();
const user = document.getElementById('reg-user').value.trim();
const pass = document.getElementById('reg-pass').value.trim();

if(!name||!user||!pass) return UI.toast("Boş alan bırakma!","error");

this.db.teachers.push({name,user,pass});
this.save();
UI.toast("Kayıt başarılı.");
},

login(){
const user = document.getElementById('login-user').value.trim();
const pass = document.getElementById('login-pass').value.trim();

const teacher = this.db.teachers.find(t=>t.user===user && t.pass===pass);

if(teacher){
this.currentTeacher = teacher;
localStorage.setItem('onur_emek_session',JSON.stringify(teacher));
UI.showApp();
UI.toast(`Hoşgeldin, ${teacher.name}`);
}else{
UI.toast("Hatalı bilgiler!","error");
}
},

logout(){
localStorage.removeItem('onur_emek_session');
location.reload();
},

//----------------- STUDENT -----------------

addStudent(){
const name = document.getElementById('new-student-name').value.trim();
const birth = document.getElementById('new-student-birth').value;
const phone = document.getElementById('new-student-phone').value.trim();

if(!name) return UI.toast("Öğrenci adı boş olamaz","error");

const student = {
id:Date.now(),
name,
birth,
phone,
completedJuz:0,
memorizationDone:0,
addedBy:this.currentTeacher.name
};

this.db.students.push(student);
this.logActivity(`${name} eklendi.`);
this.save();
UI.closeStudentModal();
},

//----------------- JUZ -----------------

assignJuz(){
const studentId = document.getElementById('juz-student').value;
const num = document.getElementById('juz-number').value;

const student = this.db.students.find(s=>s.id==studentId);
if(!student||!num) return UI.toast("Eksik bilgi!","error");

this.db.juzRecords.unshift({
id:Date.now(),
studentId,
studentName:student.name,
juz:num,
status:"Okuyor",
date:new Date().toLocaleDateString('tr-TR')
});

this.logActivity(`${student.name} ${num}. cüz başladı.`);
this.save();
},

completeJuz(id){
const record = this.db.juzRecords.find(r=>r.id===id);
if(record){
record.status="Tamamlandı";
const student = this.db.students.find(s=>s.id==record.studentId);
if(student) student.completedJuz++;
this.logActivity(`${record.studentName} ${record.juz}. cüzü bitirdi.`);
this.save();
},

//----------------- MEMORIZATION -----------------

addMemorization(){
const studentId = document.getElementById('memo-student').value;
const page = document.getElementById('memo-page').value;

const student = this.db.students.find(s=>s.id==studentId);
if(!student||!page) return UI.toast("Eksik bilgi!","error");

this.db.memorization.unshift({
id:Date.now(),
studentId,
studentName:student.name,
page,
date:new Date().toLocaleDateString('tr-TR')
});

student.memorizationDone++;
this.logActivity(`${student.name} ${page}. sayfayı ezberledi.`);
this.save();
},

//----------------- ATTENDANCE -----------------

takeAttendance(){
const today = new Date().toLocaleDateString('tr-TR');
this.db.students.forEach(s=>{
this.db.attendance.push({
id:Date.now(),
studentId:s.id,
studentName:s.name,
date:today,
status:"Hazır"
});
});
this.logActivity("Bugünkü yoklama alındı.");
this.save();
},

//----------------- ANNOUNCEMENTS -----------------

addAnnouncement(){
const title = document.getElementById('ann-title').value.trim();
const msg = document.getElementById('ann-text').value.trim();
if(!title||!msg) return UI.toast("Eksik bilgi!","error");

this.db.announcements.unshift({
title,
msg,
teacher:this.currentTeacher.name,
date:new Date().toLocaleDateString('tr-TR')
});

this.save();
UI.toast("Duyuru yayınlandı.");
},

//----------------- ACTIVITIES -----------------

logActivity(text){
this.db.activities.unshift({text,time:new Date().toLocaleTimeString('tr-TR')});
if(this.db.activities.length>10) this.db.activities.pop();
},

//----------------- REPORTS -----------------

exportPDF(){
UI.toast("PDF fonksiyonu henüz aktif değil.","info");
}

};

//----------------- UI -----------------

const UI = {

showApp(){
document.getElementById('auth-wrapper').classList.add('hidden');
document.getElementById('app-wrapper').classList.remove('hidden');
UI.refreshAll();
},

refreshAll(){
// STATS
document.getElementById('stat-students').innerText=App.db.students.length;

let totalJuz=0;
App.db.students.forEach(s=>totalJuz+=s.completedJuz);
document.getElementById('stat-juz').innerText=totalJuz;

let totalMemo=0;
App.db.students.forEach(s=>totalMemo+=s.memorizationDone);
document.getElementById('stat-memo').innerText=totalMemo;

document.getElementById('stat-att').innerText=App.db.attendance.length;

// STUDENTS
document.getElementById('students-grid').innerHTML=App.db.students.map(s=>`
<div class="student-card">
<h4>${s.name}</h4>
<p>Doğum: ${s.birth}</p>
<p>Veli: ${s.phone}</p>
<p>Cüz: ${s.completedJuz} | Ezber: ${s.memorizationDone}</p>
</div>
`).join('');

// JUZ SELECT
document.getElementById('juz-student').innerHTML=App.db.students.map(s=>`<option value="${s.id}">${s.name}</option>`).join('');
document.getElementById('memo-student').innerHTML=App.db.students.map(s=>`<option value="${s.id}">${s.name}</option>`).join('');

// TODO: diğer listeler (juz-list, memo-list, attendance-list, ann-list, leaderboard)
// basit örnek: timeline
document.getElementById('leaderboard').innerHTML=App.db.students.sort((a,b)=>b.completedJuz-a.completedJuz).map(s=>`
<div>${s.name} - ${s.completedJuz} Cüz</div>
`).join('');
},

updateDate(){
document.getElementById('today-date').innerText=new Date().toLocaleDateString('tr-TR',{weekday:'long',year:'numeric',month:'long',day:'numeric'});
},

toast(msg,type="success"){
const t=document.createElement('div');
t.className=`toast ${type}`;
t.innerText=msg;
document.getElementById('toast-container').appendChild(t);
setTimeout(()=>t.remove(),3000);
},

openStudentModal(){
document.getElementById('student-modal').style.display='flex';
},

closeStudentModal(){
document.getElementById('student-modal').style.display='none';
},

switchTab(tab){
document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));
document.getElementById('tab-'+tab).classList.add('active');
document.getElementById('page-title').innerText=tab.charAt(0).toUpperCase()+tab.slice(1);
},

initCharts(){
const ctx=document.getElementById('progressChart');
if(!ctx) return;
new Chart(ctx,{type:'bar',
data:{labels:App.db.students.map(s=>s.name),
datasets:[{label:'Cüz Tamamlandı',data:App.db.students.map(s=>s.completedJuz),backgroundColor:App.db.students.map(s=>App.db.currentTeacher?App.db.currentTeacher.color:'rgba(16,185,129,0.7)')}]}});
}

};

//----------------- INIT -----------------

App.init();
