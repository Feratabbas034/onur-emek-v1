const DB_KEY="cami_db"

const App={

db:{
teachers:[],
students:[],
juz:[],
attendance:[],
ann:[]
},

current:null,

init(){

let data=localStorage.getItem(DB_KEY)

if(data) this.db=JSON.parse(data)

UI.refresh()

},

save(){

localStorage.setItem(DB_KEY,JSON.stringify(this.db))
UI.refresh()

},

hash(str){

return btoa(str)

},

register(){

let name=reg-name.value
let user=reg-user.value
let pass=this.hash(reg-pass.value)

this.db.teachers.push({name,user,pass})

this.save()

},

login(){

let u=login-user.value
let p=this.hash(login-pass.value)

let t=this.db.teachers.find(x=>x.user==u && x.pass==p)

if(!t) return alert("hatalı")

this.current=t

auth.classList.add("hidden")
app.classList.remove("hidden")

},

logout(){

location.reload()

},

addStudent(name){

this.db.students.push({
id:Date.now(),
name,
juz:0
})

this.save()

},

assignJuz(){

let sid=juz-student.value
let num=juz-num.value

this.db.juz.push({

id:Date.now(),
sid,
num,
status:"okuyor"

})

this.save()

},

addAnn(){

this.db.ann.push({

title:ann-title.value,
text:ann-text.value,
date:new Date()

})

this.save()

}

}

const UI={

tab(id){

document.querySelectorAll("section")
.forEach(x=>x.classList.add("hidden"))

document.getElementById("tab-"+id)
.classList.remove("hidden")

},

refresh(){

stat-student.innerText=App.db.students.length

let j=0

App.db.students.forEach(s=>j+=s.juz)

stat-juz.innerText=j

students.innerHTML=App.db.students.map(s=>
`<div class="student">${s.name}</div>`
).join("")

}

}

App.init()
