import { Matrix3, Quaternion, Vector3 } from 'three'

const directions = ['L', 'R', 'P', 'A', 'I', 'S']
const axisShades = ['#aab3bf', '#d5dbe2', '#edf0f4']
const corners = [[-1, -1], [1, -1], [1, 1], [-1, 1]]
const scale = 82 / Math.sqrt(3)

function cubeBasis(orientation)
{
    // The orthogonal polar factor preserves rotation and reflection while removing stretch and shear.
    const basis = orientation.clone().multiplyScalar(1 / Math.max(...orientation.elements.map(Math.abs)))
    const inverseTranspose = new Matrix3()
    for (let iteration = 0; iteration < 24; iteration++)
    {
        inverseTranspose.copy(basis).invert().transpose()
        let change = 0
        for (let i = 0; i < 9; i++)
        {
            const current = basis.elements[i]
            const next = (current + inverseTranspose.elements[i]) * 0.5
            basis.elements[i] = next
            change = Math.max(change, Math.abs(next - current))
        }
        if (change < 1e-12) break
    }
    return basis.transpose()
}

export default class OrientationCube
{
    constructor(canvas)
    {
        this.canvas = canvas
        this.context = canvas.getContext('2d')
        this.rotation = new Quaternion()
    }

    setVolume(volume)
    {
        this.volume = volume
        const orientation = volume?.patientOrientation
        this.faces = null
        if (!orientation) return

        const patientToGrid = cubeBasis(orientation)
        const handedness = Math.sign(orientation.determinant())
        this.faces = directions.map((label, index) => {
            const axis = Math.floor(index / 2)
            const sign = index % 2 ? 1 : -1
            const center = new Vector3().setComponent(axis, sign)
            // Use superior as the top of side faces and anterior on the axial faces.
            const up = new Vector3().setComponent(axis === 2 ? 1 : 2, 1)
            // A reflected scan must keep the face lettering readable from the outside.
            const right = new Vector3().crossVectors(up, center).multiplyScalar(handedness)
            right.applyMatrix3(patientToGrid)
            up.applyMatrix3(patientToGrid)
            center.applyMatrix3(patientToGrid)
            const points = corners.map(([x, y]) => center.clone().addScaledVector(right, x).addScaledVector(up, y))
            return {
                label, points, center, right, up, color: axisShades[axis],
                normal: new Vector3().crossVectors(right, up).normalize(),
            }
        })
    }

    update(camera, volume, visible)
    {
        const changedVolume = this.volume !== volume
        if (changedVolume) this.setVolume(volume)
        const wasHidden = this.canvas.hidden
        this.canvas.hidden = !visible || !this.faces || !this.context
        if (this.canvas.hidden || (!wasHidden && !changedVolume && this.rotation.equals(camera.quaternion))) return
        this.rotation.copy(camera.quaternion)

        const view = new Matrix3().setFromMatrix4(camera.matrixWorldInverse)
        const faces = this.faces.filter(face => face.normal.clone().applyMatrix3(view).z > 1e-4)
        const project = point => point.clone().applyMatrix3(view)
        const screen = point => {
            const { x, y } = project(point)
            return [96 + x * scale, 96 - y * scale]
        }

        const ctx = this.context
        ctx.clearRect(0, 0, 192, 192)
        ctx.lineJoin = 'round'
        ctx.lineWidth = 2.5
        ctx.strokeStyle = '#414955'
        ctx.font = '650 42px system-ui'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        for (const face of faces)
        {
            ctx.beginPath()
            ctx.moveTo(...screen(face.points[0]))
            for (const point of face.points.slice(1)) ctx.lineTo(...screen(point))
            ctx.closePath()
            ctx.fillStyle = face.color
            ctx.fill()
            ctx.stroke()
            const right = project(face.right).multiplyScalar(scale / 48)
            const up = project(face.up).multiplyScalar(scale / 48)
            ctx.save()
            ctx.transform(right.x, -right.y, -up.x, up.y, ...screen(face.center))
            ctx.fillStyle = '#f5f7fa'
            ctx.fillText(face.label, 1, 1.25)
            ctx.fillStyle = '#454e5b'
            ctx.fillText(face.label, 0, 0)
            ctx.restore()
        }
        this.canvas.setAttribute('aria-label', `Patient orientation · ${faces.map(face => face.label).join(', ')}`)
    }
}
