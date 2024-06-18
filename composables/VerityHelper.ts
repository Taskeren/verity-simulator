import type {Verity2D, Verity3D} from "~/composables/Verity";
import {get2Ds} from "~/composables/Verity";

export type Counter<T extends string | number | symbol> = {[K in T]: number}

export type V2dCounter = Counter<Verity2D>
export type V3dCounter = Counter<Verity3D>

export function newV2dCounter(initialValue: number): V2dCounter {
    return {
        "0": initialValue,
        "3": initialValue,
        "4": initialValue,
    }
}

export function newV3dCounter(initialValue: number): V3dCounter {
    return {
        "00": initialValue,
        "03": initialValue,
        "04": initialValue,
        "33": initialValue,
        "34": initialValue,
        "44": initialValue,
    }
}

export function canTake(v2c: V2dCounter, shape: Verity2D) {
    return v2c[shape] > 0
}

export function take(v2c: V2dCounter, shape: Verity2D) {
    if(v2c[shape] > 0) {
        v2c[shape]--
    } else {
        throw new Error(`the shape ${shape} has already been taken out`)
    }
}

export function canTake3D(v2c: V2dCounter, shape: Verity3D) {
    let breakdownShapes = get2Ds(shape)
    if(breakdownShapes === undefined) throw new Error(`Invalid 3d shape: ${shape}`)

    if(breakdownShapes[0] === breakdownShapes[1]) {
        return v2c[breakdownShapes[0]] >= 2 // can take more than 2
    } else {
        for(let shape2d of breakdownShapes) {
            if(v2c[shape2d] <= 0) return false // remaining less than 1
        }
        return true
    }
}

export function take3D(v2c: V2dCounter, shape: Verity3D) {
    let breakdownShapes = get2Ds(shape)
    if(breakdownShapes === undefined) throw new Error(`Invalid 3d shape: ${shape}`)

    if(breakdownShapes[0] === breakdownShapes[1]) {
        take(v2c, breakdownShapes[0])
        take(v2c, breakdownShapes[0])
    } else {
        for(let shape of breakdownShapes) {
            take(v2c, shape)
        }
    }
}

export function breakdown3D(v3d: Verity3D): [Verity2D, Verity2D] {
    switch(v3d) {
        case "00": return ["0", "0"]
        case "03": return ["0", "3"]
        case "04": return ["0", "4"]
        case "33": return ["3", "3"]
        case "34": return ["3", "4"]
        case "44": return ["4", "4"]
    }
}

export function combine2D(shape1: Verity2D, shape2: Verity2D): Verity3D {
    switch(shape1) {
        case "0":
            switch(shape2) {
                case "0": return "00"
                case "3": return "03"
                case "4": return "04"
            }
        case "3":
            switch(shape2){
                case "0": return "03"
                case "3": return "33"
                case "4": return "34"
            }
        case "4":
            switch(shape2) {
                case "0": return "04"
                case "3": return "34"
                case "4": return "44"
            }
    }
}