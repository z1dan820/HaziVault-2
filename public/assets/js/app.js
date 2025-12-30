const token = localStorage.token
if(!token) location.href="/login.html"

const auth = { Authorization:"Bearer "+token }

async function api(url, opt={}){
  return fetch(url,{...opt,headers:{...auth,"Content-Type":"application/json"}})
}

async function checkStorage(){
  const r = await api("/api/storage/list")
  const j = await r.json()
  const u = await api("/api/storage/list")
  if(j.storages.length){
    storageWizard.classList.remove("hidden")
    storageList.innerHTML=""
    j.storages.forEach(s=>{
      const li=document.createElement("li")
      li.innerText=`${s.path} (${s.freeGB}GB free)`
      li.onclick=()=>selectStorage(s.path)
      storageList.appendChild(li)
    })
  }
}

async function selectStorage(path){
  await api("/api/storage/select",{method:"POST",body:JSON.stringify({path})})
  storageWizard.classList.add("hidden")
  loadFiles()
}

async function loadFiles(){
  const r = await api("/api/files")
  const j = await r.json()
  files.innerHTML=""
  j.forEach(f=>{
    const li=document.createElement("li")
    li.innerText=f
    li.onclick=()=>window.open("/api/files/download?name="+f)
    files.appendChild(li)
  })
}

async function upload(){
  const fs=[...file.files]
  for(const f of fs){
    const s=await api("/api/upload/start",{method:"POST"})
    const {uploadId}=await s.json()
    let i=0,size=512*1024
    for(let o=0;o<f.size;o+=size){
      const fd=new FormData()
      fd.append("chunk",f.slice(o,o+size))
      fd.append("index",i++)
      await fetch("/api/upload/chunk/"+uploadId,{
        method:"POST",headers:auth,body:fd
      })
    }
    await api("/api/upload/finish/"+uploadId,{
      method:"POST",
      body:JSON.stringify({filename:f.name})
    })
  }
  loadFiles()
}

function logout(){
  localStorage.clear()
  location.href="/login.html"
}

checkStorage()
loadFiles()
