import { NIFTILoader } from './NIFTILoader'

export default class Resources
{
    constructor()
    {
        this.loader = new NIFTILoader()
    }

    async loadVolume(path, onProgress, signal)
    {
        const response = await fetch(path, { signal })
        if (!response.ok) throw new Error(`Could not download the scan (HTTP ${response.status}).`)

        const total = Number(response.headers.get('content-length'))
        let loaded = 0
        const trackProgress = new TransformStream({
            transform(chunk, controller)
            {
                loaded += chunk.byteLength
                onProgress(loaded, total)
                controller.enqueue(chunk)
            },
        })

        const stream = response.body.pipeThrough(trackProgress)
        // A static host can also send the file with HTTP gzip content encoding.
        const decoded = typeof DecompressionStream === 'function' && !response.headers.get('content-encoding')
            ? stream.pipeThrough(new DecompressionStream('gzip'))
            : stream
        const data = await new Response(decoded).arrayBuffer()
        signal.throwIfAborted()
        return this.loader.parse(data)
    }
}
