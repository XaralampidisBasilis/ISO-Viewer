import * as tf from '@tensorflow/tfjs'
import Experience from '../Experience'
import VolumeMap from './Maps/VolumeMap'
import InterpolationMap from './Maps/InterpolationMap'
import ExtremaMap from './Maps/ExtremaMap'
import OccupancyMap from './Maps/OccupancyMap'
import IsotropicDistanceMap from './Maps/IsotropicDistanceMap'
import AnisotropicDistanceMap from './Maps/AnisotropicDistanceMap'
import ExtendedIsotropicDistanceMap from './Maps/ExtendedIsotropicDistanceMap'
import ExtendedAnisotropicDistanceMap from './Maps/ExtendedAnisotropicDistanceMap'
import { activeVariants } from './Variants'

const mapTypes = {
    volumeMap: VolumeMap,
    interpolationMap: InterpolationMap,
    extremaMap: ExtremaMap,
    occupancyMap: OccupancyMap,
    isotropicDistance: IsotropicDistanceMap,
    anisotropicDistance: AnisotropicDistanceMap,
    extendedIsotropicDistance: ExtendedIsotropicDistanceMap,
    extendedAnisotropicDistance: ExtendedAnisotropicDistanceMap,
}

export default class Computes
{
    static instance = null

    constructor()
    {
        if (Computes.instance) return Computes.instance

        Computes.instance = this
        this.configs = new Experience().configs
        this.maps = null
        this.distanceMap = null
        this.timings = null
    }

    timingKey(downscaleFactor)
    {
        const { blockSize, isosurfaceValue, interpolationMethod, skippingMethod } = this.configs
        return JSON.stringify([downscaleFactor, blockSize, isosurfaceValue, interpolationMethod, skippingMethod])
    }

    get preprocessingTimes()
    {
        return this.timings?.key === this.timingKey(this.configs.downscaleFactor) ? this.timings : null
    }

    async rebuild(volume, downscaleFactor, range, onProgress, signal)
    {
        const previous = this.maps
        const previousDistanceMap = this.distanceMap
        const maps = {}
        const variants = activeVariants(this.configs)
        const choices = this.configs.preprocessingVariants
        const timingKey = this.timingKey(downscaleFactor)

        this.maps = maps
        this.distanceMap = null

        const stage = async (message) =>
        {
            onProgress(message)
            await tf.nextFrame()
            signal.throwIfAborted()
        }

        try
        {
            // Map constructors resolve their dependencies in insertion order.
            for (const [name, MapType] of Object.entries(mapTypes))
            {
                const variant = choices?.[name] ?? variants[name]
                const unpacked = variant
                    ? variant === 'unpacked' || variant === 'unfusedUnpacked'
                    : this.configs.unpackedPreprocessing
                const fused = variant !== 'unfusedPacked' && variant !== 'unfusedUnpacked'
                const map = new MapType(unpacked, fused)
                maps[name] = map
                this[name] = map
            }

            await stage('Preparing voxel data')

            let started = performance.now()
            this.volumeMap.computeTensor(volume, downscaleFactor, range)
            this.interpolationMap.computeTensor()
            this.volumeMap.tensor.dispose()
            this.volumeMap.tensor = null

            let elapsed = performance.now() - started

            await stage('Building interpolation bounds')

            started = performance.now()
            this.extremaMap.computeTensor()
            this.interpolationMap.computeTexture()
            tf.dispose(this.interpolationMap.tensor)
            this.interpolationMap.tensor = null

            elapsed += performance.now() - started

            await stage('Building empty-space maps')

            started = performance.now()
            this.updateAcceleration()
            elapsed += performance.now() - started

            this.timings = { key: timingKey, elapsed }
            this.volume = volume
        }
        catch (error)
        {
            this.disposeMaps(maps)

            if (!signal.aborted)
            {
                this.maps = previous
                if (previous) Object.assign(this, previous)
                this.distanceMap = previousDistanceMap
            }
            else this.disposeMaps(previous)

            throw error
        }

        this.disposeMaps(previous)
        return this.timings.elapsed
    }

    updateAcceleration(rethreshold = true)
    {
        const occupancy = this.occupancyMap
        const previous = this.distanceMap
        const distance = this.maps[this.configs.skippingMethod] ?? null

        if (!rethreshold && distance === previous) return

        if (rethreshold || distance)
        {
            occupancy.computeTensor()

            try
            {
                distance?.computeTensor()
                const occupancyData = rethreshold ? occupancy.getTextureData() : null

                if (distance?.texture) distance.updateTexture()
                else distance?.computeTexture()

                // Keep the old occupancy until all required GPU readbacks have succeeded.
                if (occupancyData)
                {
                    if (occupancy.texture) occupancy.updateTexture(occupancyData)
                    else occupancy.computeTexture(occupancyData)
                }
            }
            finally
            {
                occupancy.tensor.dispose()
                occupancy.tensor = null

                if (distance?.tensor)
                {
                    distance.tensor.dispose()
                    distance.tensor = null
                }
            }
        }

        this.distanceMap = distance
        if (previous && previous !== distance)
        {
            previous.texture?.dispose()
            previous.texture = null
        }
    }

    disposeMaps(maps)
    {
        for (const map of Object.values(maps ?? {})) map.dispose()
    }

    destroy()
    {
        this.disposeMaps(this.maps)
        this.maps = null
        this.distanceMap = null
        this.volume = null
        Computes.instance = null
    }
}
