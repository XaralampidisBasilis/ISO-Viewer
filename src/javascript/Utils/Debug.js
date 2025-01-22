import GUI from 'lil-gui'

export default class Debug
{
    constructor()
    {
        // Enable debug mode based on URL hash
        this.active = window.location.hash === '#debug'

        if (this.active)
        {
            this.ui = new GUI()
        }
    }

    getController(gui, name) 
    {
        // Check if the controller exists in the GUI
        for (const controller of gui.controllersRecursive()) 
        {
            if (controller._name === name)
            {
                return controller        

            }
        }

        // Return null if the controller was not found
        return null
    }

    getFolder(gui, title) 
    {
        // Check if the folder exists in the GUI
        for (const folder of gui.foldersRecursive()) 
        {
            if (folder._title === title)
            {
                return folder        
            }
        }

        // Return null if the folder was not found
        return null
    }

    destroy()
    {
        if (this.active && this.ui)
        {
            this.ui.destroy() // Clean up the GUI instance
            this.ui = null
        }

        console.log('Debug destroyed')
    }
}
