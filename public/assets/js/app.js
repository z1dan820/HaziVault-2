
const token = localStorage.token
if (!token) location.href = "/login.html"

const auth = { Authorization: "Bearer " + token }

async function api(url, opt = {}) {
  return fetch(url, {
    ...opt,
    headers: { ...auth, ...(opt.headers || {}) }
  })
}

/* ================= STORAGE ================= */

async function checkStorage() {
  const r = await api("/api/storage/list")
  const j = await r.json()

  if (j.storages?.length) {
    storageWizard.classList.remove("hidden")
    storageList.innerHTML = ""

    j.storages.forEach(s => {
      const li = document.createElement("li")
      li.innerText = `${s.path} (${s.freeGB}GB free)`
      li.onclick = () => selectStorage(s.path)
      storageList.appendChild(li)
    })
  }
}

async function selectStorage(path) {
  await api("/api/storage/select", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path })
  })
  storageWizard.classList.add("hidden")
  loadFiles()
}

/* ================= FILE LIST ================= */

async function loadFiles() {
  const r = await api("/api/files")
  const j = await r.json()

  files.innerHTML = ""
  j.forEach(f => {
    const li = document.createElement("li")
    li.innerText = f
    li.onclick = () => openPreview(f)
    files.appendChild(li)
  })
}

/* ================= UPLOAD ================= */

async function upload() {
  const fs = [...file.files]

  for (const f of fs) {
    const s = await api("/api/upload/start", { method: "POST" })
    const { uploadId } = await s.json()

    let index = 0
    const chunkSize = 512 * 1024

    for (let o = 0; o < f.size; o += chunkSize) {
      const fd = new FormData()
      fd.append("chunk", f.slice(o, o + chunkSize))
      fd.append("index", index++)

      await fetch("/api/upload/chunk/" + uploadId, {
        method: "POST",
        headers: auth,
        body: fd
      })
    }

    await api("/api/upload/finish/" + uploadId, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filename: f.name })
    })
  }

  loadFiles()
}

/* ================= PREVIEW ================= */

async function openPreview(name) {
  const r = await api("/api/files/preview?name=" + encodeURIComponent(name))
  const j = await r.json()

  preview.classList.remove("hidden")
  previewContent.innerHTML = ""

  const url = j.url + "&token=" + token

  if (j.type === "image") {
    previewContent.innerHTML = `<img src="${url}">`
  } else if (j.type === "pdf") {
    previewContent.innerHTML = `<iframe src="${url}" style="width:100%;height:70vh"></iframe>`
  } else if (j.type === "video") {
    previewContent.innerHTML = `<video src="${url}" controls></video>`
  } else if (j.type === "audio") {
    previewContent.innerHTML = `<audio src="${url}" controls></audio>`
  } else {
    previewContent.innerHTML = `
      <p>Preview tidak tersedia</p>
      <a href="${url}" target="_blank">Download</a>`
  }
}

function closePreview() {
  preview.classList.add("hidden")
  previewContent.innerHTML = ""
}

/* ================= AUTH ================= */

function logout() {
  localStorage.clear()
  location.href = "/login.html"
}

checkStorage()
loadFiles()
