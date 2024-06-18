import {useChunk, useShuffle} from "#imports";
import {chunk, clone, fill, times} from "lodash-es";

export const allV2d = ["0", "3", "4"] as const
export const allV3d = ["00", "03", "04", "33", "34", "44"] as const

const allV2dNormal = allV2d as unknown as string[]
const allV3dNormal = allV3d as unknown as string[]

export type Verity2D = typeof allV2d[number]
export type Verity3D = typeof allV3d[number]

function getAllV2D(): Verity2D[] {
    return clone(allV2d as unknown as Verity2D[])
}

function getAllV3D(): Verity3D[] {
    return clone(allV3d as unknown as Verity3D[])
}

/**
 * Forcibly convert a number or string to Verity2D or undefined if not valid.
 */
export function as2D(a: number | string): Verity2D | undefined {
    if(typeof a === "number") return as2D(a.toString())
    else {
        return allV2dNormal.includes(a) ? a as Verity2D : undefined
    }
}

/**
 * Forcibly convert a string to Verity3D or null if not valid.
 */
export function as3D(a: string): Verity3D | undefined {
    return allV3dNormal.includes(a) ? a as Verity3D : undefined
}

/**
 * Combine 2 2D shapes into a 3D shape.
 *
 * @deprecated use combine2D instead
 */
export function get3D(a: Verity2D, b: Verity2D): Verity3D | undefined {
    if(a > b) return get3D(b, a)
    return as3D("" + a + b)
}

/**
 * @deprecated use combine2D instead
 */
export function get3DFromArray(a: Verity2D[]): Verity3D | undefined {
    return a.length == 2 ? get3D(a[0], a[1]) : undefined
}

/**
 * Break down a 3D shape into 2 2D shapes.
 *
 * @deprecated use breakdown3D instead
 */
export function get2Ds(a: Verity3D): Verity2D[] | undefined {
    let s1 = as2D(parseInt(a[0]))
    let s2 = as2D(parseInt(a[1]))

    if(s1 === undefined || s2 === undefined) return undefined
    else return [s1, s2]
}

function arrRemoveFirst<T>(arr: T[], value: T): T[] {
    const index = arr.indexOf(value)
    if(index !== -1) arr.splice(index, 1)
    return arr
}

export class VerityGame {
    inner: VerityInner
    outer: VerityOuter

    isDone: boolean = false

    constructor() {
        this.inner = new VerityInner(this)
        this.outer = new VerityOuter(this)
    }

    printToConsole() {
        console.log("VG")
        console.log(this.inner.toString())
        console.log(this.outer.toString())
    }

    static generate() {
        return generateVerityGame()
    }

    loadPreset(preset: string) {
        if(preset.length !== "034003344003344".length) return false
        let intrinsicData = preset.substring(0, "034".length)
        for(let i = 0; i < intrinsicData.length; i++) {
            let s = as2D(intrinsicData[i])
            if(s === undefined) throw new Error(`Invalid intrinsic data at ${i}: ${intrinsicData[i]}`)
            else this.inner.intrinsic[i] = s
        }
        let innerHeld = useChunk(preset.substring("034".length, "034003344".length), 2)
        for(let i = 0; i < innerHeld.length; i++) {
            this.inner.held[i] = innerHeld[i].map(it => {
                let s = as2D(it)
                if(s === undefined) throw new Error(`Invalid inner held data at ${i}: ${innerHeld[i]}`)
                return s
            })
        }
        let outerHeld = useChunk(preset.substring("034003344".length, "034003344003344".length), 2)
        for(let i = 0; i < outerHeld.length; i++) {
            this.outer.held[i] = outerHeld[i].map(it => {
                let s = as2D(it)
                if(s === undefined) throw new Error(`Invalid outer held data at ${i}: ${outerHeld[i]}`)
                return s
            })
        }
    }

    getPreset() {
        let s = ""
        s += this.inner.intrinsic.join("")
        s += this.inner.held.map(it => it.join("")).join("")
        s += this.outer.held.map(it => it.join("")).join("")
        return s
    }

    moveInner(roomIdx: number, pickUpIdx: number, statueIdx: number) {
        // roomIdx must not be the same to statueIdx, where the statueIdx refers to the destination room
        if(roomIdx === statueIdx) return false

        // cache the shape for further usage
        let pickedUpShape = this.inner.held[roomIdx][pickUpIdx]

        // remove the shape in the room
        this.inner.held[roomIdx] = this.inner.held[roomIdx].filter((_, index) => index !== pickUpIdx)

        // add the shape to the dst room
        this.inner.held[statueIdx].push(pickedUpShape)

        // extinguish the shadow in the dst room
        let dstIntrinsic = this.inner.intrinsic[statueIdx]
        // don't extinguish the intrinsic
        if(dstIntrinsic !== pickedUpShape) {
            this.inner.shadow[statueIdx] = this.inner.shadow[statueIdx].map(value => value === pickedUpShape ? null : value)
        }

        // calls for check
        this.checkDone()

        return true
    }

    moveOuter(statue1: number, statue2: number, shape1: Verity2D, shape2: Verity2D) {
        if(!this.outer.held[statue1].includes(shape1)) return false
        if(!this.outer.held[statue2].includes(shape2)) return false

        // remove the shapes from the statue
        this.outer.held[statue1] = arrRemoveFirst(this.outer.held[statue1], shape1)
        this.outer.held[statue2] = arrRemoveFirst(this.outer.held[statue2], shape2)

        // add the shapes to the statue
        this.outer.held[statue1].push(shape2)
        this.outer.held[statue2].push(shape1)

        // calls for check
        this.checkDone()

        return true
    }

    private isInnerDone(roomIdx: number) {
        // check shadows that should be cleared
        let otherShadows = this.inner.shadow[roomIdx]
            .filter(value => value !== null)
            .filter(value => value !== this.inner.intrinsic[roomIdx])
        if(otherShadows.length > 0) return false
        // check the key
        let built = this.inner.builtShape[roomIdx]
        let outerKey = get3DFromArray(this.outer.held[roomIdx])
        return outerKey == built
    }

    checkDone() {
        for(let i = 0; i < 3; i++) {
            let done = this.isInnerDone(i)
            if(!done) {
                this.isDone = false
                return
            }
        }
        this.isDone = true
    }

}

export class VerityInner {

    game: VerityGame

    intrinsic: Verity2D[] // 3 array
    held: Verity2D[][] // 3x(max to 6) array
    shadow: (Verity2D | null)[][] // 3x3 array
    builtShape: (Verity3D | undefined)[]

    constructor(game: VerityGame) {
        this.game = game
        this.intrinsic = new Array(3)
        this.held = new Array(6)
        fill(this.held, new Array(2))
        this.shadow = new Array(3)
        fill(this.shadow, new Array(3))
        this.builtShape = new Array(3)
    }

    toString() {
        return `VI(${this.intrinsic[0]}[${this.held[0]}], ${this.intrinsic[1]}[${this.held[1]}], ${this.intrinsic[2]}[${this.held[2]}])`
    }

    buildShape(roomIdx: number, idx1: number, idx2: number) {
        let s1 = this.held[roomIdx][idx1]
        let s2 = this.held[roomIdx][idx2]

        if(s1 === undefined || s2 === undefined) return false

        this.builtShape[roomIdx] = get3D(s1, s2)

        this.game.checkDone()

        return true
    }

    breakShape(roomIdx: number) {
        if(this.builtShape[roomIdx] !== undefined) {
            this.builtShape[roomIdx] = undefined
        }

        this.game.checkDone()
    }
}

export class VerityOuter {

    game: VerityGame

    held: Verity2D[][] // 3x2 array

    constructor(game: VerityGame) {
        this.game = game
        this.held = new Array(3)
        fill(this.held, new Array(2))
    }

    toString() {
        return `VO([${this.held[0]}], [${this.held[1]}], [${this.held[2]}])`
    }

}

/**
 * Randomly generate a new Verity instance.
 */
export function generateVerityGame(): VerityGame {

    let g = new VerityGame()
    let inner = g.inner
    let outer = g.outer

    // generate inner
    let r1 = useShuffle(allV2d)
    for(let i = 0; i < r1.length; i++) {
        inner.intrinsic[i] = r1[i]
    }
    let r2 = useShuffle(allV2d)
    for(let i = 0; i < r2.length; i++) {
        inner.held[i] = useShuffle([inner.intrinsic[i], r2[i]])
    }
    times(3, (idx) => {
        inner.shadow[idx] = [inner.intrinsic[0], inner.intrinsic[1], inner.intrinsic[2]]
    })

    // generate outer
    let r3 = useShuffle([...allV2d, ...allV2d])
    let r3c = chunk(r3, 2)
    for(let i = 0; i < r3c.length; i++) {
        outer.held[i] = r3c[i]
    }

    return g
}

export function getImg(shape: Verity2D | Verity3D | undefined): string | undefined {
    switch(shape) {
        case "0":
            return "circle.png"
        case "3":
            return "triangle.png"
        case "4":
            return "square.png"
        case "00":
            return "sphere.png"
        case "03":
            return "cone.png"
        case "04":
            return "cylinder.png"
        case "33":
            return "pyramid.png"
        case "34":
            return "prism.png"
        case "44":
            return "cube.png"
    }
}