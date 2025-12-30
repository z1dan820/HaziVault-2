#!/bin/bash
set -e
echo "🔥 Init HaziVault NEXT LEVEL (Single Installer)"

APP=hazivault
mkdir -p $APP/{backend,frontend/assets/{css,js,images},storage/{users,temp,chunks},logs}
cd $APP

# ---------------- ROOT ----------------
cat > README.md <<'EOF'
# HaziVault
Private Cloud Drive (STB/NAS Friendly)
EOF

cat > .gitignore <<'EOF'
node_modules
.env
storage
logs
EOF

# ---------------- BACKEND ----------------
cd backend
cat > package.json <<'EOF'
{
  "name": "hazivault",
  "version": "1.1.0",
  "private": true,
  "main": "server.js",
  "scripts": { "start": "node server.js" },
  "dependencies": {
    "bcrypt": "^5.1.1",
    "cors": "^2.8.5",
    "dotenv": "^16.4.5",
    "express": "^4.19.2",
    "jsonwebtoken": "^9.0.2",
    "multer": "^1.4.5-lts.1",
    "uuid": "^9.0.1"
  }
}
EOF

cat > server.js <<'EOF'
/**
 * HaziVault NEXT LEVEL – Single Backend
 */
require("dotenv").config()
const express = require("express")
const fs = require("fs")
const path = require("path")
const jwt = require("jsonwebtoken")
const bcrypt = require("bcrypt")
const multer = require("multer")
const { v4: uuid } = require("uuid")

const app = express()
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(require("cors")())

/* ===== CONFIG ===== */
const PORT = process.env.PORT || 3000
const SECRET = process.env.JWT_SECRET || "hazivault_secret"
const ROOT = __dirname
const STORAGE = path.join(ROOT, "../storage")
const USERS = path.join(STORAGE, "users")
const TEMP = path.join(STORAGE, "temp")
const CHUNKS = path.join(STORAGE, "chunks")
const DB = path.join(ROOT, "db.json")
const QUOTA_MB = 500
const RATE = new Map()

;[STORAGE, USERS, TEMP, CHUNKS].forEach(d => !fs.existsSync(d) && fs.mkdirSync(d, { recursive: true }))
if (!fs.existsSync(DB)) fs.writeFileSync(DB, JSON.stringify({ users: [], shares: [] }, null, 2))

const readDB = () => JSON.parse(fs.readFileSync(DB))
const writeDB = (d) => fs.writeFileSync(DB, JSON.stringify(d, null, 2))

/* ===== UTIL ===== */
const sizeDir = (dir) => fs.existsSync(dir)
  ? fs.readdirSync(dir).reduce((t,f)=> {
      const p=path.join(dir,f)
      return t + (fs.statSync(p).isDirectory()? sizeDir(p): fs.statSync(p).size)
    },0)
  : 0

const rateLimit = (req,res,next)=>{
  const ip=req.ip; const now=Date.now()
  const r=RATE.get(ip)||{c:0,t:now}
  if (now-r.t>60000){ r.c=0; r.t=now }
  r.c++; RATE.set(ip,r)
  if (r.c>120) return res.status(429).json({error:"rate limit"})
  next()
}

const auth = (req,res,next)=>{
  try{
    const t=req.headers.authorization?.split(" ")[1]
    req.user=jwt.verify(t,SECRET); next()
  }catch{ res.status(401).json({error:"unauthorized"}) }
}

/* ===== AUTH ===== */
app.post("/api/register", rateLimit, async (req,res)=>{
  const {username,password}=req.body
  if(!username||!password) return res.json({error:"invalid"})
  const db=readDB()
  if(db.users.find(u=>u.username===username)) return res.json({error:"exists"})
  const hash=await bcrypt.hash(password,10)
  db.users.push({id:uuid(),username,password:hash,quotaMB:QUOTA_MB})
  fs.mkdirSync(path.join(USERS,username),{recursive:true})
  writeDB(db); res.json({ok:true})
})

app.post("/api/login", rateLimit, async (req,res)=>{
  const {username,password}=req.body
  const u=readDB().users.find(x=>x.username===username)
  if(!u||!(await bcrypt.compare(password,u.password))) return res.json({error:"invalid"})
  res.json({token: jwt.sign({username},SECRET,{expiresIn:"12h"})})
})

/* ===== FOLDER TREE ===== */
app.post("/api/folder", auth, (req,res)=>{
  const {dir}=req.body
  const p=path.join(USERS,req.user.username,dir||"")
  fs.mkdirSync(p,{recursive:true}); res.json({ok:true})
})

app.get("/api/tree", auth, (req,res)=>{
  const base=path.join(USERS,req.user.username)
  const walk=(d)=>fs.readdirSync(d).map(n=>{
    const p=path.join(d,n); const s=fs.statSync(p)
    return s.isDirectory()? {name:n,dir:true,children:walk(p)}:{name:n,dir:false}
  })
  res.json(walk(base))
})

/* ===== CHUNK UPLOAD ===== */
const up = multer({ dest: TEMP })
app.post("/api/chunk/start", auth, (req,res)=>{
  const id=uuid()
  fs.mkdirSync(path.join(CHUNKS,id),{recursive:true})
  res.json({uploadId:id})
})

app.post("/api/chunk/:id", auth, up.single("chunk"), (req,res)=>{
  const {index,filename}=req.body
  const d=path.join(CHUNKS,req.params.id)
  fs.renameSync(req.file.path, path.join(d, index))
  res.json({ok:true})
})

app.post("/api/chunk/finish/:id", auth, (req,res)=>{
  const {filename,dir=""}=req.body
  const userDir=path.join(USERS,req.user.username)
  const used=sizeDir(userDir)
  if(used > QUOTA_MB*1024*1024) return res.json({error:"quota exceeded"})
  const out=path.join(userDir,dir,filename)
  fs.mkdirSync(path.dirname(out),{recursive:true})
  const parts=fs.readdirSync(path.join(CHUNKS,req.params.id)).sort((a,b)=>a-b)
  const ws=fs.createWriteStream(out)
  parts.forEach(p=>ws.write(fs.readFileSync(path.join(CHUNKS,req.params.id,p))))
  ws.end()
  fs.rmSync(path.join(CHUNKS,req.params.id),{recursive:true,force:true})
  res.json({ok:true})
})

/* ===== LIST FILE ===== */
app.get("/api/files", auth, (req,res)=>{
  const dir=req.query.dir||""
  const p=path.join(USERS,req.user.username,dir)
  res.json(fs.existsSync(p)? fs.readdirSync(p):[])
})

/* ===== SHARE LINK (EXPIRY) ===== */
app.post("/api/share", auth, (req,res)=>{
  const {file,expires=3600}=req.body
  const id=uuid(); const db=readDB()
  db.shares.push({id,owner:req.user.username,file,exp:Date.now()+expires*1000})
  writeDB(db); res.json({link:"/s/"+id})
})
app.get("/s/:id",(req,res)=>{
  const db=readDB(); const s=db.shares.find(x=>x.id===req.params.id)
  if(!s||Date.now()>s.exp) return res.send("expired")
  res.sendFile(path.join(USERS,s.owner,s.file))
})

/* ===== FRONTEND ===== */
app.use("/assets", express.static(path.join(__dirname,"../frontend/assets")))
app.get("/",(_,res)=>res.sendFile(path.join(__dirname,"../frontend/index.html")))
app.listen(PORT,()=>console.log("🔥 HaziVault up on",PORT))
EOF

# ---------------- FRONTEND ----------------
cd ../frontend
cat > index.html <<'EOF'
<!DOCTYPE html><html><head>
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>HaziVault</title>
<link rel="stylesheet" href="/assets/css/app.css">
</head><body>
<header><img src="/assets/images/logo.png"><h1>HaziVault</h1></header>
<section class="card">
<input id="u" placeholder="user"><input id="p" type="password" placeholder="pass">
<button onclick="login()">Login</button>
</section>
<section class="card">
<input type="file" id="f" multiple>
<button onclick="upload()">Chunk Upload</button>
<ul id="list"></ul>
</section>
<script src="/assets/js/app.js"></script>
</body></html>
EOF

cat > assets/css/app.css <<'EOF'
*{box-sizing:border-box}body{margin:0;background:#0b0f14;color:#e7eef6;font-family:system-ui}
header{display:flex;align-items:center;gap:12px;padding:14px;background:#0f1720}
header img{height:36px}
.card{margin:12px;padding:12px;border-radius:12px;background:#111827}
input,button{width:100%;padding:10px;margin:6px 0;border-radius:10px;border:0}
button{background:#0ea5a4;color:#012}
EOF

cat > assets/js/app.js <<'EOF'
let T=""
async function login(){
  const r=await fetch("/api/login",{method:"POST",headers:{"Content-Type":"application/json"},
  body:JSON.stringify({username:u.value,password:p.value})})
  const j=await r.json(); T=j.token; alert("ok")
}
async function upload(){
  const f=[...document.getElementById("f").files]
  for(const file of f){
    const s=await fetch("/api/chunk/start",{method:"POST",headers:{Authorization:"Bearer "+T}})
    const {uploadId}=await s.json()
    const size=512*1024; let i=0
    for(let off=0; off<file.size; off+=size){
      const c=file.slice(off,off+size)
      const fd=new FormData()
      fd.append("chunk",c); fd.append("index",i++); fd.append("filename",file.name)
      await fetch("/api/chunk/"+uploadId,{method:"POST",headers:{Authorization:"Bearer "+T},body:fd})
    }
    await fetch("/api/chunk/finish/"+uploadId,{method:"POST",
      headers:{Authorization:"Bearer "+T,"Content-Type":"application/json"},
      body:JSON.stringify({filename:file.name})})
  }
  alert("uploaded")
}
EOF

echo "✅ HaziVault NEXT LEVEL READY"
