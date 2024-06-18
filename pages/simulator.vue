<script setup lang="ts">
import rangeInt from "~/utils/rangeInt";
import {get3DFromArray, type Verity2D, VerityGame} from "~/composables/Verity";

const showDebugInfo = ref(false)

let {d, p} = useRoute().query
if(typeof d !== "undefined") showDebugInfo.value = true

let game = ref<VerityGame>(generateVerityGame())
if(typeof p === "string") {
  try {
    game.value.loadPreset(p)
  } catch(e) {
    console.error(e)
  }
}

interface InteractionData {
  inner: {
    pickUpIdx: (number | undefined)[], // 3 array, the idx of the picked-up shape in game.inner.held, undefined means the room didn't picked up any shape
  },
  outer: {
    pickUpShape: (Verity2D | undefined),
    dissectIdx: (number | undefined),
    dissectShape: (Verity2D | undefined),
  }
}

function getEmptyInteractionData(): InteractionData {
  return {
    inner: {
      pickUpIdx: new Array(3),
    },
    outer: {
      pickUpShape: undefined,
      dissectIdx: undefined,
      dissectShape: undefined,
    }
  }
}

let interactionData = ref<InteractionData>(getEmptyInteractionData())

/**
 * Determine if the shapeIdx in the room can be interacted
 */
function canInnerPickup(roomIdx: number, shapeIdx: number) {
  let wasPickedUpIdx = interactionData.value.inner.pickUpIdx[roomIdx]
  let builtShape = game.value.inner.builtShape[roomIdx]
  return builtShape === undefined && (wasPickedUpIdx === undefined || wasPickedUpIdx !== shapeIdx)
}

function doInnerPick(roomIdx: number, shapeIdx: number) {
  let wasPickedUpIdx = interactionData.value.inner.pickUpIdx[roomIdx]
  if(wasPickedUpIdx !== undefined) {
    if(game.value.inner.buildShape(roomIdx, wasPickedUpIdx, shapeIdx)) {
      interactionData.value.inner.pickUpIdx[roomIdx] = undefined
    }
  } else {
    interactionData.value.inner.pickUpIdx[roomIdx] = shapeIdx
  }
}

/**
 * Determine if the statue in the room can be interacted
 */
function canInnerRegister(roomIdx: number, statueIdx: number) {
  let roomPickupIdx = interactionData.value.inner.pickUpIdx[roomIdx]
  // don't register if not picked up
  if(roomPickupIdx === undefined) return false
  // don't register to self
  return roomIdx !== statueIdx
}

/**
 * Perform the register
 *
 * @param roomIdx the roomIdx where the statue is in
 * @param statueIdx the statusIdx
 */
function doInnerRegister(roomIdx: number, statueIdx: number) {
  let pickUpIdx = interactionData.value.inner.pickUpIdx[roomIdx]
  if(pickUpIdx === undefined) return // check

  // the main logic
  game.value.moveInner(roomIdx, pickUpIdx, statueIdx)

  // clear pickUp data
  interactionData.value.inner.pickUpIdx[roomIdx] = undefined
}

function breakShape(roomIdx: number) {
  game.value.inner.breakShape(roomIdx)
}

function canOuterPick(shape: Verity2D) {
  let wasPickedShape = interactionData.value.outer.pickUpShape
  let wasDissectShape = interactionData.value.outer.dissectShape
  return wasDissectShape !== shape && (wasPickedShape === undefined || wasPickedShape !== shape) && !(wasPickedShape !== undefined && wasDissectShape !== undefined)
}

function doOuterPick(shape: Verity2D) {
  let wasPickedShape = interactionData.value.outer.pickUpShape
  if(wasPickedShape !== undefined) {
    // todo
  } else {
    interactionData.value.outer.pickUpShape = shape
  }
}

function canOuterDissect(statueIdx: number) {
  let wasPickedShape = interactionData.value.outer.pickUpShape
  if(wasPickedShape === undefined) return false
  let wasDissectIdx = interactionData.value.outer.dissectIdx;
  if(wasDissectIdx === statueIdx) return false
  let heldShapes = game.value.outer.held[statueIdx]
  return heldShapes.includes(wasPickedShape)
}

function doOuterDissect(statueIdx: number) {
  let wasDissectedIdx = interactionData.value.outer.dissectIdx
  let wasDissectedShape = interactionData.value.outer.dissectShape
  let nowDissectShape = interactionData.value.outer.pickUpShape
  if(wasDissectedIdx !== undefined && wasDissectedShape !== undefined && nowDissectShape !== undefined) {
    if(game.value.moveOuter(wasDissectedIdx, statueIdx, wasDissectedShape, nowDissectShape)) {
      interactionData.value.outer.pickUpShape = undefined
      interactionData.value.outer.dissectIdx = undefined
      interactionData.value.outer.dissectShape = undefined
    }
  } else {
    interactionData.value.outer.dissectIdx = statueIdx
    interactionData.value.outer.dissectShape = interactionData.value.outer.pickUpShape
    interactionData.value.outer.pickUpShape = undefined
  }
}

function reset() {
  game.value = generateVerityGame()
  interactionData.value = getEmptyInteractionData()
}

</script>

<template>
  <ClientOnly>
    <div class="max-w-4xl mx-auto transition" :class="{'bg-emerald-400': game.isDone}">
      <!-- Control Panel -->
      <div class="p-8 border border-stone-600 space-x-2 space-y-4">
        <button class="px-4 py-2 text-white text-center bg-red-600 hover:bg-red-800 rounded-lg shadow-lg"
                @click="reset()">
          重置
        </button>
        <button class="btn bg-red-600" @click="showDebugInfo = !showDebugInfo">显示/隐藏除错数据</button>
        <span>种子：{{ game.getPreset() }}</span>
      </div>
      <!-- Outer -->
      <div class="p-8 border border-stone-600 space-x-2 space-y-4">
        <h2 class="text-center font-bold">外场</h2>
        <div v-if="showDebugInfo" class="p-4 flex flex-col font-mono bg-emerald-400">
          <span>PickShape {{ interactionData.outer.pickUpShape ?? "None" }}</span>
          <span>DissectIdx {{ interactionData.outer.dissectIdx ?? "None" }}</span>
          <span>DissectShape {{ interactionData.outer.dissectShape ?? "None" }}</span>
        </div>
        <div class="flex justify-center items-center gap-8">
          <div v-for="shape in allV2d" class="flex flex-col justify-center items-center gap-2">
            <img class="size-16" :src="getImg(shape)" :alt="`the shape ${shape}`">
            <button class="sm-btn" :disabled="!canOuterPick(shape)" @click="doOuterPick(shape)">获取裂片</button>
          </div>
        </div>
        <div class="flex flex-col md:flex-row justify-center items-center gap-8">
          <div v-for="statueIdx in rangeInt(3)" class="flex flex-col justify-center items-center gap-4">
            <div>
              <img class="size-24" src="/guardian.svg" alt="the guardian">
            </div>
            <img class="inline-block size-16" :src="getImg(get3DFromArray(game.outer.held[statueIdx]))"
                 :alt="`the 3d symbol of room ${statueIdx} = ${get3DFromArray(game.outer.held[statueIdx])} (${game.outer.held[statueIdx]})`">
            <div v-if="showDebugInfo" class="p-4 flex flex-col font-mono bg-emerald-400">{{
                game.outer.held[statueIdx]
              }}
            </div>
            <button class="sm-btn" :disabled="!canOuterDissect(statueIdx)" @click="doOuterDissect(statueIdx)">剖开
            </button>
          </div>
        </div>
      </div>
      <!-- Inner -->
      <div class="p-8 border border-stone-600 space-x-2 space-y-4">
        <h2 class="text-center font-bold">内场</h2>
        <div v-for="({}, roomIdx) of ['左', '中', '右']"
             class="p-4 flex flex-col justify-center items-center gap-8 border border-stone-400">
          <div v-if="showDebugInfo" class="p-4 flex flex-col font-mono bg-emerald-400">
        <span>
          Intrinsic {{ game.inner.intrinsic[roomIdx] }}
        </span>
            <span>
          Held {{ game.inner.held[roomIdx] }}
        </span>
            <span>
          Shadow {{ game.inner.shadow[roomIdx] }}
        </span>
            <span>
          Pickup {{ interactionData.inner.pickUpIdx[roomIdx] ?? "None" }}
        </span>
            <span>
          Built {{ game.inner.builtShape[roomIdx] ?? "None" }}
        </span>
          </div>
          <div class="flex flex-col md:flex-row justify-center items-center gap-8">
            <div v-for="(intrinsicShape, statueIdx) of game.inner.shadow[roomIdx]"
                 class="flex flex-col justify-center items-center gap-4">
              <div class="flex justify-center items-center">
                <img v-if="intrinsicShape !== null" class="size-12" :src="getImg(intrinsicShape as Verity2D)"
                     :alt="`the intrinsic symbol in room ${statueIdx} = ${game.inner.intrinsic[statueIdx]}`">
                <div v-else class="size-12"></div>
              </div>
              <div>
                <img class="size-24" :class="{'border border-stone-600 rounded-lg': roomIdx === statueIdx}"
                     src="/guardian.svg" alt="the guardian">
              </div>
              <button class="sm-btn" :disabled="!canInnerRegister(roomIdx, statueIdx)"
                      @click="doInnerRegister(roomIdx, statueIdx)">登记裂片
              </button>
            </div>
          </div>
          <div class="flex justify-center items-center gap-8">
            <div class="flex flex-col justify-center items-center gap-2"
                 v-for="({},shapeIdx) in game.inner.held[roomIdx]">
              <img class="inline-block size-16" :src="getImg(game.inner.held[roomIdx][shapeIdx])"
                   :alt="`the ${shapeIdx} held symbol in room ${roomIdx} = ${game.inner.held[roomIdx][shapeIdx]}`">
              <button class="sm-btn" :disabled="!canInnerPickup(roomIdx, shapeIdx)"
                      @click="doInnerPick(roomIdx, shapeIdx)">
                获取裂片
              </button>
            </div>
          </div>
          <div v-show="game.inner.builtShape[roomIdx] !== undefined"
               class="flex flex-col justify-center items-center gap-2">
            <img class="size-24" :src="getImg(game.inner.builtShape[roomIdx])"
                 :alt="`the built 3D shape = ${game.inner.builtShape[roomIdx]}`">
            <button class="sm-btn" @click="breakShape(roomIdx)">拆解</button>
          </div>
        </div>
      </div>
      <FooterCredit class="text-center"/>
    </div>
  </ClientOnly>
</template>

<style lang="postcss" scoped>
.btn {
  @apply px-4 py-2 text-white text-center bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-700 rounded-lg shadow-lg transition;
}

.sm-btn {
  @apply btn;
  @apply px-2 py-1;
}
</style>