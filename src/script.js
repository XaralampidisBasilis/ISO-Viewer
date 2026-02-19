
import { setTensorflow } from './javascript/tensorflow';
import Experience from './javascript/Experience'
import { getSourcesFromUrl } from './javascript/Config'

// Global instance management
let experienceInstance = null

/**
 * Create or replace the ISO-Viewer experience
 * @param {Object} options - Configuration options
 * @param {Array} options.sources - Array of sources to load
 * @returns {Experience} The created experience instance
 */
async function createExperience(options = {}) 
{
    // Destroy existing experience if any
    if (experienceInstance) 
    {
        experienceInstance.destroy()
        experienceInstance = null
    }

    // Initialize TensorFlow if not already done
    await setTensorflow()

    const canvas = document.querySelector('canvas.webgl')
    if (!canvas) throw new Error('Canvas element not found')
    
    const context = canvas.getContext('webgl2')
    if (!context) throw new Error('WebGL2 not supported by your browser or device.')

    // Merge options with URL parameters as fallback
    const mergedOptions = 
    {
        sources: options.sources || getSourcesFromUrl(),
        ...options,
    }

    // Create new experience
    experienceInstance = new Experience(canvas, context, mergedOptions)
    
    // Expose globally for Angular access
    window.ISOViewer = 
    {
        instance: experienceInstance,
        createExperience,
        destroy: destroyExperience,
    }

    return experienceInstance
}

/**
 * Destroy the current experience
 */
function destroyExperience() 
{
    if (experienceInstance) 
    {
        experienceInstance.destroy()
        experienceInstance = null
    }
}

// Initialize on page load
(async () => 
{
    try 
    {
        await createExperience()
    } 
    catch (error) 
    {
        console.error('Failed to initialize ISO-Viewer:', error)
    }
})()

// Expose globally for Angular/external access
window.ISOViewer = 
{
    instance: null,
    createExperience,
    destroy: destroyExperience,
}