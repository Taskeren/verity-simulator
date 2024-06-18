<script setup lang="ts">

import {type Verity3D, type Verity2D, get2Ds, allV2d, get3DFromArray, as2D} from "~/composables/Verity";
import {canTake3D, newV2dCounter, take3D} from "~/composables/VerityHelper";
import {type ExciseInstruction, resolveStatues, type StatueGroup} from "~/composables/VerityCalculator";

let showRandomButton = ref(true)

let inner = ref(new Array<Verity2D | undefined>(3))
let outer = ref(new Array<Verity3D | undefined>(3))

function canSelectInner(idx: number, shape: Verity2D): boolean {
  for(let otherIdx of [0, 1, 2].filter(value => value !== idx)) {
    if(inner.value[otherIdx] === shape) {
      return false
    }
  }
  return true
}

function isSelectedInner(idx: number, shape: Verity2D): boolean {
  return inner.value[idx] === shape
}

function clickInner(idx: number, shape: Verity2D): void {
  let wasSelected = inner.value[idx]
  if(wasSelected === shape) { // unselect
    inner.value[idx] = undefined
  } else {
    for(let otherIdx of [0, 1, 2].filter(value => value !== idx)) {
      if(inner.value[otherIdx] === shape) {
        return
      }
    }
    inner.value[idx] = shape
  }
}

function canSelectOuter(idx: number, shape: Verity3D): boolean {
  if(outer.value[idx] === shape) return true

  let v2c = newV2dCounter(2)
  for(let select3D of outer.value) {
    if(select3D === undefined) continue

    if(canTake3D(v2c, select3D)) {
      take3D(v2c, select3D)
    } else {
      return false
    }
  }

  return canTake3D(v2c, shape)
}

function isSelectedOuter(idx: number, shape: Verity3D): boolean {
  return outer.value[idx] === shape
}

function clickOuter(idx: number, shape: Verity3D): void {
  let wasSelected = outer.value[idx]
  if(wasSelected === shape) {
    outer.value[idx] = undefined
  } else {
    outer.value[idx] = shape
  }
}

function isAllSelectionDone() {
  for(let innerShape of inner.value) {
    if(innerShape === undefined) return false
  }
  for(let outerShape of outer.value) {
    if(outerShape === undefined) return false
  }
  return true
}

let answer = ref<[StatueGroup, ExciseInstruction][]>([])
let answerHint = computed(() => getExciseShortHint(answer.value.map(([_, excise]) => excise)))

function resolve() {
  let intrinsics = inner.value

  // init seeking array
  // it is the most general situation, which contains no same shapes like 00
  // instead, it should be something like 03, 04, 34
  let seeking = new Array<Verity3D>(3)
  for(let index in intrinsics) {
    let intrinsic = intrinsics[index]
    seeking[index] = get3DFromArray(allV2d.filter(it => it !== intrinsic))!
  }

  let result = resolveStatues(outer.value as StatueGroup, seeking as StatueGroup)
  if(result === undefined) {
    console.log("?")
    return
  }
  let [statueGroupSteps, exciseSteps] = result
  statueGroupSteps.shift()
  answer.value = useZip(statueGroupSteps, exciseSteps) as [StatueGroup, ExciseInstruction][]
}

function reset() {
  inner.value = new Array(3)
  outer.value = new Array(3)
  answer.value = []
}

function random() {
  reset()
  inner.value = useShuffle(allV2d)
  outer.value = useShuffle(useZip(allV2d, allV2d).map(([a, b]) => combine2D(a!, b!)))
}

function getSeed() {
  let innerValue = inner.value
  let outerValue = outer.value
  if(innerValue.includes(undefined) || outerValue.includes(undefined)) return "UNKNOWN"
  return `${innerValue}${outerValue}`.replaceAll(",", "")
}

function getName2D(v2d: Verity2D) {
  switch(v2d) {
    case "0":
      return "圆型"
    case "3":
      return "金字塔型"
    case "4":
      return "六边形"
  }
}

function getNameSide(side: number) {
  switch(side) {
    case 0:
      return "左侧"
    case 1:
      return "中间"
    case 2:
      return "右侧"
  }
}

function getName2DShort(v2d: Verity2D) {
  switch(v2d) {
    case "0":
      return "圆"
    case "3":
      return "三"
    case "4":
      return "方"
  }
}

function getNameSideShort(side: number) {
  switch(side) {
    case 0:
      return "左"
    case 1:
      return "中"
    case 2:
      return "右"
  }
}

function getExciseShortHint(excises: ExciseInstruction[]) {
  return excises.map(excise => `${getNameSideShort(excise.from1)}${getName2DShort(excise.excise1)}${getNameSideShort(excise.from2)}${getName2DShort(excise.excise2)}`).join("，")
}

function copyHint() {
  navigator.clipboard.writeText(answerHint.value)
  alert("OK")
}

</script>

<template>
  <div class="max-w-4xl mx-auto">
    <div class="m-4 p-4 border border-emerald-400 rounded-lg shadow-lg space-y-8">
      <h1 class="text-4xl text-center font-bold">真理外场计算器</h1>
      <div class="mx-8">
        <UInput placeholder="034003344"/>
      </div>
      <div class="grid grid-cols-3 justify-center items-center gap-4">
        <div v-for="idx in rangeInt(3)" class="flex flex-wrap justify-center items-center gap-1">
          <div v-for="shape in allV2d">
            <button
                class="size-16 p-1 border border-emerald-600 bg-emerald-400 disabled:bg-gray-300 rounded-lg shadow-lg"
                :class="{ 'bg-emerald-600': isSelectedInner(idx, shape) }"
                :disabled="!canSelectInner(idx, shape)" @click="clickInner(idx, shape)"><img :src="getImg(shape)"
                                                                                             alt="the symbol"/>
            </button>
          </div>
        </div>
        <div v-for="idx in rangeInt(3)" class="flex flex-wrap justify-center items-center gap-1">
          <div v-for="shape in allV3d">
            <button
                class="size-16 p-1 border border-emerald-600 bg-emerald-400 disabled:bg-gray-300 rounded-lg shadow-lg"
                :class="{ 'bg-emerald-600': isSelectedOuter(idx, shape) }"
                :disabled="!canSelectOuter(idx, shape)" @click="clickOuter(idx, shape)"><img :src="getImg(shape)"
                                                                                             alt="the symbol"/>
            </button>
          </div>
        </div>
      </div>
      <div class="px-8 space-x-4">
        <button
            class="px-4 py-2 text-white text-center font-semibold bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-500 rounded-lg shadow-lg"
            :disabled="!isAllSelectionDone()" @click="resolve()">解题
        </button>
        <button
            class="px-4 py-2 text-white text-center font-semibold bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-lg"
            @click="reset()">重置
        </button>
        <button v-if="showRandomButton"
                class="px-4 py-2 text-white text-center font-semibold bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-lg"
                @click="random()">随机
        </button>
      </div>
      <div v-show="answer.length > 0" class="px-8 flex flex-col gap-4">
        <p class="text-center underline underline-offset-4 cursor-pointer" @click="copyHint()">{{ answerHint }}</p>
        <div v-for="([statues, excise], idx) in answer" class="flex flex-col justify-center items-center">
          <h4 class="font-semibold">第 {{ idx + 1 }} 步</h4>
          <p>将 {{ getName2D(excise.excise1) }} 从 {{ getNameSide(excise.from1) }} 剖开</p>
          <p>将 {{ getName2D(excise.excise2) }} 从 {{ getNameSide(excise.from2) }} 剖开</p>
          <div class="flex justify-center items-center">
            <img v-for="statue in statues" class="size-12" :src="getImg(statue)" alt="the symbol"/>
          </div>
        </div>
        <div class="flex flex-col justify-center items-center">
          <h4 class="font-semibold">完成</h4>
        </div>
      </div>
    </div>
    <FooterCredit class="text-center"/>
    <p class="text-center">The algorithm is inspired from <a class="text-blue-400"
        href="https://www.reddit.com/r/raidsecrets/comments/1dbua5g/made_a_python_script_to_solve_outside_excise/">/u/swegmesterflex (Reddit)</a>.
    </p>
  </div>
</template>

<style scoped lang="postcss">

</style>