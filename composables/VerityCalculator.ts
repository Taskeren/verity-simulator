/**
 * This calculator algorithm is from https://www.reddit.com/r/raidsecrets/comments/1dbua5g/made_a_python_script_to_solve_outside_excise/
 * and optimized for localization by not hard coding the result instructions.
 */

import type {Verity2D, Verity3D} from "~/composables/Verity";
import {combine2D} from "~/composables/VerityHelper";

export type StatueGroup = [Verity3D, Verity3D, Verity3D]

export function isStatueGroupEqual(a: StatueGroup, b: StatueGroup): boolean {
    if(a.length !== b.length) {
        return false;
    }

    for(let i = 0; i < a.length; i++) {
        if(a[i] !== b[i]) {
            return false;
        }
    }

    return true;
}

export function resolveStatues(curr: StatueGroup, seek: StatueGroup) {
    return generate_swaps(curr, seek)
}

export type ExciseInstruction = {
    excise1: Verity2D,
    from1: number,
    excise2: Verity2D,
    from2: number,
}

function generate_swaps(curr: StatueGroup, seek: StatueGroup): [StatueGroup[], ExciseInstruction[]] | undefined {

    /**
     * The queue to be processed. This uses BFS (breadth-first search), which
     * If a element is not satisfy the target, its successor is added to the end of
     * the array.
     *
     * For iterating convenience, the StatueGroup is reversed, which
     * the current node is at the head, and the parents are at the end.
     */
    let queue: [StatueGroup[], ExciseInstruction[]][] = [[[curr], []]]

    /**
     * The cache of the visited situations, to prevent dead-loop.
     */
    let visited: StatueGroup[] = []

    /**
     * Loop until the queue is empty.
     */
    while(queue.length > 0) {
        let [nodes, instructions] = queue.shift()!
        let [current_node, ...parent_nodes] = nodes


        if(isStatueGroupEqual(current_node, seek)) {
            return [nodes.reverse(), instructions]
        }

        if(visited.includes(current_node)) {
            continue
        } else {
            visited.push(current_node)
        }

        let [successors, successor_instructions] = generate_successor(current_node)
        for(let [successor, successorInstruction] of useZip(successors, successor_instructions)) {
            queue.push([[successor!, current_node, ...parent_nodes], instructions.concat(successorInstruction!)])
        }
    }

    return undefined
}

function excise3D(v3d: Verity3D, v2d: Verity2D) {
    let [s1, s2] = breakdown3D(v3d)
    if(s1 === v2d || s2 === v2d) {
        return s1 === v2d ? s2 : s1
    } else {
        throw new Error(`the 2D shape to be removed ${v2d} is not in the 3D shape ${v3d}`)
    }
}

function swapStatue(statues: StatueGroup, idx1: number, idx2: number, shape1: Verity2D, shape2: Verity2D) {
    statues[idx1] = combine2D(excise3D(statues[idx1], shape1), shape2)
    statues[idx2] = combine2D(excise3D(statues[idx2], shape2), shape1)
    return statues
}

function generate_successor(solids: StatueGroup): [StatueGroup[], ExciseInstruction[]] {
    let results: StatueGroup[] = []
    let result_instructions: ExciseInstruction[] = []

    const poss_ind_swaps: [number, number][] = [[0, 1], [0, 2], [1, 2]]
    const poss_shape_swaps: [Verity2D, Verity2D][] = [
        ["0", "3"],
        ["3", "0"],
        ["0", "4"],
        ["4", "0"],
        ["3", "4"],
        ["4", "3"]
    ]

    for(let [idx1, idx2] of poss_ind_swaps) {
        for(let [shape1, shape2] of poss_shape_swaps) {
            try {
                let res = swapStatue(useCloneDeep(solids), idx1, idx2, shape1, shape2)
                results.push(res)
                result_instructions.push({
                    from1: idx1,
                    excise1: shape1,
                    from2: idx2,
                    excise2: shape2
                })
            } catch(e) {
                // ignore and continue
            }
        }
    }

    return [results, result_instructions]
}
