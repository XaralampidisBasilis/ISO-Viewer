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

        // A static host can send the file with HTTP gzip content encoding.
        return this.readVolume(response.body, !response.headers.get('content-encoding'),
            Number(response.headers.get('content-length')), onProgress, signal)
    }

    async loadFile(file, onProgress, signal)
    {
        const magic = new Uint8Array(await file.slice(0, 2).arrayBuffer())
        const compressed = magic[0] === 0x1f && magic[1] === 0x8b
        return this.readVolume(file.stream(), compressed, file.size, onProgress, signal)
    }

    async readVolume(input, compressed, total, onProgress, signal)
    {
        let loaded = 0
        const trackProgress = new TransformStream({
            transform(chunk, controller)
            {
                signal.throwIfAborted()
                loaded += chunk.byteLength
                onProgress(loaded, total)
                controller.enqueue(chunk)
            },
        })

        const stream = input.pipeThrough(trackProgress)
        const decoded = typeof DecompressionStream === 'function' && compressed
            ? stream.pipeThrough(new DecompressionStream('gzip'))
            : stream
        const data = await new Response(decoded).arrayBuffer()
        signal.throwIfAborted()
        return this.loader.parse(data)
    }
}
