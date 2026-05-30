export async function inferImage(file) {
const fd = new FormData()
fd.append('file', file)
const res = await fetch('/api/infer/image', { method: 'POST', body: fd })
if (!res.ok) throw new Error('Image inference failed')
const blob = await res.blob()
return URL.createObjectURL(blob)
}


export async function inferVideo(file, sampleRate=3) {
const fd = new FormData()
fd.append('file', file)
fd.append('sample_rate', String(sampleRate))
const res = await fetch('/api/infer/video', { method: 'POST', body: fd })
if (!res.ok) throw new Error('Video inference failed')
const blob = await res.blob()
return URL.createObjectURL(blob)
}