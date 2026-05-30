import React from 'react'
export default function ImageResult({ url }) {
if (!url) return null
return (
<div className="mt-4">
<h3 className="font-medium mb-2">Result</h3>
<img src={url} alt="result" className="rounded shadow" />
</div>
)
}