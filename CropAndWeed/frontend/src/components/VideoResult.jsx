import React from 'react'
export default function VideoResult({ url }) {
if (!url) return null
return (
<div className="mt-4">
<h3 className="font-medium mb-2">Processed Video</h3>
<video src={url} controls className="rounded shadow w-full max-w-3xl" />
</div>
)
}