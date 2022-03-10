"use strict";

const DEFAULT_SEED = '16796183546'
const WHITELISTED_ITEMS = [
    'minecraft:obsidian', 
    'minecraft:ender_pearl', 
    'minecraft:string', 
    'minecraft:glowstone_dust', 
    'minecraft:crying_obsidian', 
    'minecraft:potion',
    'minecraft:splash_potion'
]

const seedinput = document.getElementById("seed")

const goldinput = document.getElementById("goldinput")
const goldslider = document.getElementById("goldslider")
const filter = document.getElementById("filter")
const bartersout = document.getElementById("items")

const blazeinput = document.getElementById("blazeinput")
const blazeslider = document.getElementById("blazeslider")
const blazeout = document.getElementById("rods")

const flint = document.getElementById("flint")

let entries

let currseed = BigInt(DEFAULT_SEED)
let gold = 1
let blaze = 1

seedinput.addEventListener('input', () => {
    const tempseed = parseLong(seedinput.value)
    if (tempseed == null) {
        return
    }

    currseed = tempseed
    refreshSeed()
})

goldinput.addEventListener('input', () => {
    const tempgold = parseInt(goldinput.value)
    if (isNaN(tempgold) || tempgold > 500 || tempgold < 0) {
        return
    }

    gold = tempgold
    goldslider.value = Math.min(Math.max(gold, goldslider.min), goldslider.max);
    refreshGold()
})

goldslider.addEventListener('input', () => {
    const tempgold = parseInt(goldslider.value)
    if (isNaN(tempgold) || tempgold > 500 || tempgold < 0) {
        return
    }

    gold = tempgold
    goldinput.value = goldslider.value
    refreshGold()
})

filter.addEventListener('input', () => {
    refreshGold()
})

blazeinput.addEventListener('input', () => {
    const tempblaze = parseInt(blazeinput.value)
    if (isNaN(tempblaze) || tempblaze > 500 || tempblaze < 0) {
        return
    }

    blaze = tempblaze
    blazeslider.value = Math.min(Math.max(blaze, blazeslider.min), blazeslider.max)
    refreshBlaze()
})

blazeslider.addEventListener('input', () => {
    const tempblaze = parseInt(blazeslider.value)
    if (isNaN(tempblaze) || tempblaze > 500 || tempblaze < 0) {
        return
    }

    blaze = tempblaze
    blazeinput.value = blaze
    refreshBlaze()
})

async function load() {
    clearInputs()
    await fetchBarterTable()
    refreshSeed()
}

function clearInputs() {
    seedinput.value = DEFAULT_SEED
    goldinput.value = '1'
    goldslider.value = '1'
    blazeinput.value = '1'
    blazeslider.value = '1'
}

async function fetchBarterTable() {
    const response = await fetch('piglin_bartering.json')
    const bartering_table = await response.json()
    entries = bartering_table["pools"][0]["entries"]
    for (let entry of entries) {
        entry["weight"] = BigInt(entry["weight"])
    }
}

function refreshSeed() {
    refreshGold()
    refreshBlaze()
    refreshGravel()
}

function refreshGold() { 
    const goldrandom = new JavaRandom(currseed)
    const res = {}

    for (let i=0; i < gold; i++) {
        const nextBarter = getNextBarter(goldrandom)
        add(res, nextBarter.item, nextBarter.amount)
    }

    bartersout.innerHTML = ''
    for (let item in res) {
        if (filter.checked && !WHITELISTED_ITEMS.includes(item)) continue
        const row = document.createElement('tr')
        const itemdisp = document.createElement('td')
        const amountdisp = document.createElement('td')
        itemdisp.innerText = item
        amountdisp.innerText = res[item]
        row.appendChild(itemdisp)
        row.appendChild(amountdisp)
        bartersout.appendChild(row)
    }
}

function getNextBarter(random) {
    const res = {}
    let j = random.nextInt(423n)
    for (let entry of entries) {
        if ((j -= entry['weight']) >= 0) continue;
        let amount = getAmount(entry, random)
        return {'item': entry.name, 'amount': amount}
    }
    return res
}

function getAmount(entry, random) {
    let amount = 1
    const functions = entry.functions
    if (functions != null) {
        for (let f of functions) {
            if (f.function == "minecraft:set_count") {
                amount = helperNextInt(random, BigInt(f.count.min), BigInt(f.count.max)) //UniformLootTableRange.java:50
            } else if(f.function == "minecraft:enchant_randomly") {
                random.nextInt(1n) //EnchantRandomlyLootFunction.java:68
                helperNextInt(random, 1n, 3n) //EnchantRandomlyLootFunction.java:74 soul speed is 1 to 3
            }
        }
    }
    return amount
}

function refreshBlaze() {
    const blazerandom = new JavaRandom(currseed)
    const res = {}

    for (let i=0; i < blaze; i++) {
        const nextBlazeDrop = getNextBlazeDrop(blazerandom)
        add(res, nextBlazeDrop.item, nextBlazeDrop.amount)
    }

    blazeout.innerHTML = ''
    for (let item in res) {
        const row = document.createElement('tr')
        const itemdisp = document.createElement('td')
        const amountdisp = document.createElement('td')
        itemdisp.innerText = item
        amountdisp.innerText = res[item]
        row.appendChild(itemdisp)
        row.appendChild(amountdisp)
        blazeout.appendChild(row)
    }
}

function getNextBlazeDrop(random) {
    //assume no looting
    //one function: set count 0 to 1
    let amount = helperNextInt(random, 0n, 1n)
    return {'item': 'minecraft:blaze_rod', 'amount': amount}
}

function refreshGravel() {
    const gravelrandom = new JavaRandom(currseed)
    let count = 0
    do {
        count++
    } while (!(gravelrandom.nextFloat() < 0.1))
    flint.textContent = count
}

function add(object, key, value) {
    if (key in object) {
        object[key] += value
    } else {
        object[key] = value
    }
}

function helperNextInt(random, min, max) {
    if (min >= max) {
        return min
    }
    return random.nextInt(max - min + 1n) + min
}

function parseLong(str) {
    if (str.length > 22) {
        return null
    }
    let res
    try {
        res = BigInt(str)
    } catch (ignored) {
        return null
    }
    if (res > (2n**63n - 1n) || res < (2n**63n * -1n)) {
        return null
    }
    return res
}

load()