import React, { useState } from 'react'


export default function Uploader({ onImage, onVideo }) {
const [file, setFile] = useState(null)
const [type, setType] = useState('image')
const [sampleRate, setSampleRate] = useState(3)


const handleSubmit = (e) => {
e.preventDefault()
if (!file) return
if (type === 'image') onImage(file)
else onVideo(file, sampleRate)
}


return (
<form onSubmit={handleSubmit} className="space-y-3">
<div className="flex items-center gap-3">
<select value={type} onChange={(e)=>setType(e.target.value)} className="border rounded p-2">
<option value="image">Image</option>
<option value="video">Video</option>
</select>
{type === 'video' && (
<label className="flex items-center gap-2 text-sm">
Sample every
<input type="number" min="1" value={sampleRate} onChange={e=>setSampleRate(Number(e.target.value))} className="border rounded p-1 w-16" />
frame(s)
</label>
)}
</div>
<input type="file" accept={type==='image' ? 'image/*' : 'video/*'} onChange={e=>setFile(e.target.files?.[0]||null)} className="block" />
<button className="bg-green-600 text-white px-4 py-2 rounded">Detect</button>
</form>
)
}