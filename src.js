///////////////////////////////
// Global Data
///////////////////////////////
let currentTab = document.getElementById("pokemonSheet")
let currentTabButton = document.getElementById("pokemonButton")
let tectonicData = {} // See main for creation of this

///////////////////////////////
// Main Funcitonality
///////////////////////////////
async function main() {
    let tectonicFiles = []
    await Promise.all([
        fileFetch("PBS/types.txt"),
        fileFetch("PBS/tribes.txt"),
        fileFetch("PBS/abilities.txt"),
        fileFetch("PBS/abilities_new.txt"),
        fileFetch("PBS/moves.txt"),
        fileFetch("PBS/moves_new.txt"),
        fileFetch("PBS/items.txt"),
        fileFetch("PBS/pokemon.txt"),
    ]).then((values) => tectonicFiles.push(...values))
        .catch((error) => console.error(error))

    let types = standardFilesParser([tectonicFiles[0]], parsePokemonTypes)
    let tribes = parseTribes(tectonicFiles[1])
    let abilities = standardFilesParser([tectonicFiles[2], tectonicFiles[3]], parseAbilities)
    let moves = standardFilesParser([tectonicFiles[4], tectonicFiles[5]], parseMoves)
    let items = filterToHeldItems(standardFilesParser([tectonicFiles[6]], parseItems))
    let pokemon = standardFilesParser([tectonicFiles[7]], parsePokemon)

    let typeChart = buildTypeChart(types)
    buildTribesUI(tribes)
    buildAbilitiesUI(abilities)
    buildMovesUI(moves)
    buildItemsUI(items)
    buildPokemonUI(pokemon, abilities, tribes)

    tectonicData = {
        types: types,
        typeChart: typeChart,
        tribes: tribes,
        abilities: abilities,
        moves: moves,
        items: items,
        pokemon: pokemon
    }
}

///////////////////////////////
// Data Processing
///////////////////////////////
function standardFilesParser(files, dataParser) {
    const map = new Map()

    files.forEach(file => {
        let pairs = []

        file.split(/\r?\n/).forEach(line => {
            if (line.startsWith("#-")) {
                if (pairs.length !== 0) {
                    const value = dataParser(pairs)
                    map.set(value.key, value)
                }

                pairs.length = 0
            } else if (!line.includes("#") && line.length > 0) {
                if (line.startsWith("[")) {
                    const value = line.substring(1, line.length - 1)
                    pairs.push({ key: "Bracketvalue", value: value })
                } else {
                    const split = line.split('=')
                    const key = split[0].trim()
                    const value = split[1].trim()

                    pairs.push({ key: key, value: value })
                }
            }
        })

        if (pairs.length !== 0) {
            const value = dataParser(pairs)
            map.set(value.key, value)

            pairs.length = 0
        }
    });

    return map
}

function parsePokemonTypes(pairs) {
    let obj = {
        index: -1,
        name: "",
        key: "",
        weaknesses: "",
        resistances: "",
        immunities: "",
        isRealType: true
    }
    pairs.forEach(pair => {
        switch (pair.key) {
            case "Bracketvalue":
                obj.index = pair.value
                break
            case "Name":
                obj.name = pair.value
                break
            case "InternalName":
                obj.key = pair.value
                break
            case "Weaknesses":
                obj.weaknesses = pair.value
                break
            case "Resistances":
                obj.resistances = pair.value
                break
            case "Immunities":
                obj.immunities = pair.value
                break
            case "IsPseudoType":
                obj.isRealType = false
                break
        }
    })

    return obj
}

function parseTribes(file) {
    const map = new Map()
    file.split(/\r?\n/).filter(line => line.length > 0).forEach(line => {
        let obj = {
            key: "",
            activationCount: 5,
            name: "",
            description: "",
        }

        const split = line.split(',')
        obj.key = split[0]
        obj.activationCount = parseInt(split[1])
        obj.name = obj.key[0] + obj.key.substring(1).toLowerCase()
        obj.description = split[2].replaceAll('"', "")

        map.set(obj.key, obj)
    })

    return map
}

function parseAbilities(pairs) {
    let obj = {
        key: "",
        name: "",
        description: "",
        flags: []
    }
    pairs.forEach(pair => {
        switch (pair.key) {
            case "Bracketvalue":
                obj.key = pair.value
                break
            case "Name":
                obj.name = pair.value
                break
            case "Description":
                obj.description = pair.value
                break
            case "Flags":
                obj.flags = pair.value.split(',')
                break
        }
    })

    return obj
}

function parseMoves(pairs) {
    let obj = {
        key: "",
        name: "",
        type: "",
        category: "",
        power: 0,
        accuracy: 0,
        pp: 0,
        target: "",
        effectChance: 0,
        priority: 0,
        description: "",
        flags: []
    }
    pairs.forEach(pair => {
        switch (pair.key) {
            case "Bracketvalue":
                obj.key = pair.value
                break
            case "Name":
                obj.name = pair.value
                break
            case "Type":
                obj.type = pair.value
                break
            case "Category":
                obj.category = pair.value
                break
            case "Power":
                obj.power = parseInt(pair.value)
                break
            case "Accuracy":
                obj.accuracy = parseInt(pair.value)
                break
            case "TotalPP":
                obj.pp = parseInt(pair.value)
                break
            case "Target":
                obj.target = pair.value
                break
            case "EffectChance":
                obj.effectChance = parseInt(pair.value)
                break
            case "Priority":
                obj.priority = parseInt(pair.value)
                break
            case "Description":
                obj.description = pair.value
                break
            case "Flags":
                obj.flags = pair.value.split(',')
                break
        }
    })

    return obj
}

function parseItems(pairs) {
    let obj = {
        key: "",
        name: "",
        pocket: 0, // Note, seems like pocket 5 is all the held items
        description: "",
        flags: []
    }
    pairs.forEach(pair => {
        switch (pair.key) {
            case "Bracketvalue":
                obj.key = pair.value
                break
            case "Name":
                obj.name = pair.value
                break
            case "Pocket":
                obj.pocket = parseInt(pair.value)
                break
            case "Description":
                obj.description = pair.value
                break
            case "Flags":
                obj.flags = pair.value.split(',')
                break
        }
    })

    return obj
}

function filterToHeldItems(allItems) {
    const items = new Map()
    allItems.forEach(item => {
        if (item.pocket == 5) {
            items.set(item.key, item)
        }
    })

    return items
}

function parsePokemon(pairs) {
    let obj = {
        key: "",
        name: "",
        dexNum: "",
        type1: "",
        type2: "",
        hp: 0,
        attack: 0,
        attack: 0,
        defense: 0,
        speed: 0,
        spAttack: 0,
        spDefense: 0,
        bst: 0,
        abilities: [],
        levelMoves: [], // Note that this is an object of {level, move}
        lineMoves: [],
        tribes: [],
        evolutions: [], // Note that this is an object of {pokemon, method, condition}
    }
    pairs.forEach(pair => {
        switch (pair.key) {
            case "Bracketvalue":
                obj.dexNum = parseInt(pair.value)
                break
            case "Name":
                obj.name = pair.value
                break
            case "InternalName":
                obj.key = pair.value
                break
            case "Type1":
                obj.type1 = pair.value
                break
            case "Type2":
                obj.type2 = pair.value
                break
            case "BaseStats":
                const stats = pair.value.split(',')
                obj.hp = parseInt(stats[0])
                obj.attack = parseInt(stats[1])
                obj.defense = parseInt(stats[2])
                obj.speed = parseInt(stats[3])
                obj.spAttack = parseInt(stats[4])
                obj.spDefense = parseInt(stats[5])
                obj.bst = obj.hp + obj.attack + obj.defense + obj.speed + obj.spAttack + obj.spDefense
                break
            case "Abilities":
                obj.abilities = pair.value.split(',')
                break
            case "Moves":
                const moveSplit = pair.value.split(',')
                const moves = []
                for (let i = 0; i < moveSplit.length; i += 2) {
                    moves.push({ level: parseInt(moveSplit[i]), move: moveSplit[i + 1] })
                }
                obj.levelMoves = moves
                break
            case "LineMoves":
                obj.lineMoves = pair.value.split(',')
                break
            case "Tribes":
                obj.tribes = pair.value.split(',')
                break
            case "Evolutions":
                const evoSplit = pair.value.split(',')
                const evolutions = []
                for (let i = 0; i < evoSplit.length; i += 3) {
                    evolutions.push({ pokemon: evoSplit[i], method: evoSplit[i + 1], condition: evoSplit[i + 2] })
                }
                obj.evolutions = evolutions
                break
        }
    })

    return obj
}

///////////////////////////////
// UI
///////////////////////////////
function swapTab(button, newTabId) {
    currentTab.classList.add("gone")
    currentTab = document.getElementById(newTabId)
    currentTab.classList.remove("gone")

    currentTabButton.classList.remove("topNavButtonSelected")
    currentTabButton = button
    currentTabButton.classList.add("topNavButtonSelected")
}

function buildTypeChart(types) {
    const pokemonTypeChartHeaderTemplate = getTemplate("pokemonTypeChartHeaderTemplate")
    const pokemonTypeChartRowTemplate = getTemplate("pokemonTypeChartRowTemplate")
    const typeChartTableTheadRow = document.getElementById("typeChartTableTheadRow")
    const typeChartTable = document.getElementById("typeChartTable")

    const typeChart = []
    types.forEach(_ => {
        typeChart.push(Array(types.size).fill(1.0))
    })

    types.forEach(attacker => {
        let imgSrc = `resources/types/${attacker.key}.png`
        let attackerNode = pokemonTypeChartRowTemplate.cloneNode(true)
        let row = attackerNode.getElementById("row")
        attackerNode.getElementById("img").src = imgSrc

        types.forEach(defender => {
            let backgroundColor = "transparent"
            let effectiveness = ""
            let title = "Normal Effectiveness"

            if (defender.weaknesses.includes(attacker.key)) {
                typeChart[attacker.index][defender.index] = 2.0
                backgroundColor = "#2E8B57"
                effectiveness = "2"
                title = "Super Effective"
            } else if (defender.resistances.includes(attacker.key)) {
                typeChart[attacker.index][defender.index] = 0.5
                backgroundColor = "#F7BE81"
                effectiveness = "½"
                title = "Not Very Effective"
            } else if (defender.immunities.includes(attacker.key)) {
                typeChart[attacker.index][defender.index] = 0.0
                backgroundColor = "#b04f4a"
                effectiveness = "0"
                title = "No Effect"
            }

            if (defender.isRealType) {
                let cell = row.insertCell(row.length)
                cell.classList.add("typeChartCell")
                cell.style.backgroundColor = backgroundColor
                cell.title = `${attacker.name} → ${defender.name} = ${title}`
                cell.innerHTML = effectiveness
            }
        })

        if (attacker.isRealType) {
            let headerNode = pokemonTypeChartHeaderTemplate.cloneNode(true)
            headerNode.getElementById("img").src = imgSrc
            typeChartTableTheadRow.append(headerNode)
            typeChartTable.append(attackerNode)
        }
    })

    return typeChart
}

function buildTribesUI(tribes) {
    const template = getTemplate("tribeRowTemplate")
    const table = document.getElementById("tribesTable")

    tribes.forEach(tribe => {
        let node = template.cloneNode(true)

        node.getElementById("name").innerHTML = tribe.name
        node.getElementById("description").innerHTML = tribe.description
        table.append(node)
    })
}

function buildItemsUI(items) {
    const template = getTemplate("itemRowTemplate")
    const table = document.getElementById("itemsTable")

    items.forEach(item => {
        let node = template.cloneNode(true)

        node.getElementById("icon").src = `resources/items/${item.key}.png`
        node.getElementById("name").innerHTML = item.name
        node.getElementById("description").innerHTML = item.description
        table.append(node)
    })
}

function buildAbilitiesUI(abilities) {
    const template = getTemplate("abilityRowTemplate")
    const table = document.getElementById("abilitiesTable")

    abilities.forEach(ability => {
        let node = template.cloneNode(true)

        node.getElementById("name").innerHTML = ability.name
        node.getElementById("description").innerHTML = ability.description
        table.append(node)
    })
}

function buildMovesUI(moves) {
    const template = getTemplate("moveRowTemplate")
    const table = document.getElementById("movesTable")

    moves.forEach(move => {
        let node = template.cloneNode(true)
        const powerText = move.power == 0 ? '-' : move.power.toString()
        const accText = move.accuracy == 0 ? '-' : move.accuracy
        const prioText = move.priority == 0 ? '-' : move.priority

        node.getElementById("name").innerHTML = move.name
        node.getElementById("type").src = `resources/types/${move.type}.png`
        node.getElementById("split").src = `resources/types/${move.category}.png`
        node.getElementById("power").innerHTML = powerText
        node.getElementById("acc").innerHTML = accText
        node.getElementById("pp").innerHTML = move.pp
        node.getElementById("prio").innerHTML = prioText
        node.getElementById("description").innerHTML = move.description
        table.append(node)
    })
}

function buildPokemonUI(pokemon, abilities, tribes) {
    const template = getTemplate("pokemonRowTemplate")
    const table = document.getElementById("pokemonTable")

    pokemon.forEach(mon => {
        let node = template.cloneNode(true)
        let monAbilities = mon.abilities.map(x => abilities.get(x).name)
        let monTribes = mon.tribes.map(x => tribes.get(x).name)

        node.getElementById("icon").src = `resources/pokemon/${mon.key}.png`
        node.getElementById("name").innerHTML = mon.name
        node.getElementById("type1").src = `resources/types/${mon.type1}.png`
        if (mon.type2.length > 0) { node.getElementById("type2").src = `resources/types/${mon.type2}.png` }
        node.getElementById("abilities").innerHTML = `${monAbilities.join("<br>")}`
        node.getElementById("tribes").innerHTML = `${monTribes.join("<br>")}`
        node.getElementById("hp").innerHTML = mon.hp
        node.getElementById("attack").innerHTML = mon.attack
        node.getElementById("defense").innerHTML = mon.defense
        node.getElementById("spA").innerHTML = mon.spAttack
        node.getElementById("spD").innerHTML = mon.spDefense
        node.getElementById("speed").innerHTML = mon.speed
        node.getElementById("bst").innerHTML = mon.bst
        table.append(node)
    })
}

///////////////////////////////
// Helpers
///////////////////////////////
function getTemplate(id) {
    return document.getElementById(id).content
}

async function fileFetch(path) {
    const baseUrl = "https://raw.githubusercontent.com/xeuorux/Pokemon-Tectonic/refs/heads/main/"
    const fullPath = baseUrl + path
    const response = await fetch(fullPath);

    if (!response.ok) {
        throw new Error(`Fetching ${fullPath} status: ${response.status}`);
    }

    return await response.text()
}

///////////////////////////////
// Start
///////////////////////////////
main()