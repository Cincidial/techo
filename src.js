///////////////////////////////
// Global Data
///////////////////////////////
const goodMoveFlags = ["Sound", "Punch", "Dance", "Blade", "Biting", "Kicking", "Pulse", "Wind", "Foretold", "Bite"]
let currentTab = document.getElementById("pokemonSheet")
let currentTabButton = document.getElementById("pokemonButton")
let currentFullMovesThead = null
let currentModalMovesThead = null
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
    let items = standardFilesParser([tectonicFiles[6]], parseItems)
    let heldItems = filterToHeldItems(items)
    let pokemon = addAllTribesAndEvolutions(standardFilesParser([tectonicFiles[7]], parsePokemon))
    let typeChart = buildTypeChart(types)

    tectonicData = {
        types: types,
        typeChart: typeChart,
        tribes: tribes,
        abilities: abilities,
        moves: moves,
        items: items,
        heldItems: heldItems,
        pokemon: pokemon,
    }
    buildTribesUI(tribes)
    buildAbilitiesUI(abilities)
    buildMovesUIFull(document.getElementById("movesFullTheadType"), true)
    buildItemsUI(heldItems)
    buildPokemonUI(pokemon, abilities, tribes)
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
        lineMoves: [], // Note that only the first evo has this
        tribes: [],
        evolutions: [], // Note that this is an object of {pokemon, method, condition}
        wildItems: [],
        firstEvolution: "",
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
            case "WildItemCommon":
                obj.wildItems.push(pair.value)
                break
            case "WildItemUncommon":
                obj.wildItems.push(pair.value)
                break
            case "WildItemRare":
                obj.wildItems.push(pair.value)
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

function addAllTribesAndEvolutions(pokemon) {
    pokemon.forEach(mon => {
        if (mon.firstEvolution.length == 0) {
            recursivelyAddFirstEvolution(pokemon, mon, mon.key)
        }
    })

    pokemon.forEach(mon => {
        if (mon.tribes.length == 0) {
            const evoPath = recursivelyFindEvoPath(pokemon, pokemon.get(mon.firstEvolution), mon)
            const mostRecentEvoWithTribes = evoPath.reverse().find(evo => evo.tribes.length > 0)
            mon.tribes = mostRecentEvoWithTribes == null ? [] : mostRecentEvoWithTribes.tribes
        }
    })

    return pokemon
}

function recursivelyAddFirstEvolution(pokemon, mon, first) {
    mon.firstEvolution = first
    mon.evolutions.forEach(evo => recursivelyAddFirstEvolution(pokemon, pokemon.get(evo.pokemon), first))
}

function recursivelyFindEvoPath(pokemon, cur, find) {
    if (cur.key == find.key) {
        return [cur]
    }

    for (const evo of cur.evolutions) {
        const result = recursivelyFindEvoPath(pokemon, pokemon.get(evo.pokemon), find)
        if (result.length > 0) {
            return [cur].concat(result)
        }
    }

    return []
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

function buildSpanWithTooltip(name, title) {
    return `<span class="fontMedium" title="${title}">${name}</span>`
}

function getTypeImgSrc(key) {
    return `resources/types/${key}.png`
}

function getItemImgSrc(key) {
    return `resources/items/${key}.png`
}

function getPokemonImgSrc(key) {
    return `resources/pokemon/${key}.png`
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
        let imgSrc = getTypeImgSrc(attacker.key)
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

function buildMovesUIFull(element) {
    const sort = element.innerHTML
    const asc = currentFullMovesThead != element

    currentFullMovesThead = asc ? element : null
    buildMovesUI(tectonicData.moves, document.getElementById("movesTable"), sort, asc)
}

function buildMovesUIMon(element) {
    const pokemon = tectonicData.pokemon.get(element.parentNode.querySelector("#moveMonKey").value)
    const sort = element.innerHTML
    const asc = currentModalMovesThead != element
    const moves = new Map()
    const firstEvo = tectonicData.pokemon.get(pokemon.firstEvolution)

    pokemon.levelMoves.map(x => tectonicData.moves.get(x.move)).forEach(x => moves.set(x.key, x))
    firstEvo.lineMoves.map(x => tectonicData.moves.get(x)).forEach(x => {
        if (!moves.has(x.key)) {
            moves.set(x.key, x)
        }
    })

    currentModalMovesThead = asc ? element : null
    buildMovesUI(moves, element.parentNode.parentNode.parentNode, sort, asc)
}

function buildMovesUI(moves, table, sort, asc) {
    const template = getTemplate("moveRowTemplate")
    const tbody = table.getElementsByTagName('tbody')[0]
    const sortDirection = asc ? 1 : -1

    tbody.innerHTML = ""
    Array.from(moves.values()).sort((a, b) => {
        switch (sort) {
            case "Name":
                return a.key.localeCompare(b.key) * sortDirection
            case "Split":
                return a.category.localeCompare(b.category) * sortDirection
            case "Power":
                return (a.power - b.power) * sortDirection
            case "Acc":
                return (a.accuracy - b.accuracy) * sortDirection
            case "PP":
                return (a.pp - b.pp) * sortDirection
            case "Prio":
                return (a.priority - b.priority) * sortDirection
            default:
                return a.type.localeCompare(b.type) * sortDirection
        }
    }).forEach(move => {
        let node = template.cloneNode(true)
        const powerText = move.power == 0 ? '-' : move.power.toString()
        const accText = move.accuracy == 0 ? '-' : move.accuracy
        const prioText = move.priority == 0 ? '-' : move.priority

        let flags = move.flags.map(x => {
            if (goodMoveFlags.includes(x)) {
                return x
            }

            switch (x) {
                case "HighCriticalHitRate":
                case "VeryHighCriticalHitRate":
                    return "Crit"
                default:
                    return ""
            }
        }).filter(x => x.length > 0)
        if (!move.flags.includes("CanProtect")) {
            flags.push("Skips Protections")
        }
        let flagsString = flags.length > 0 ? `(${flags.join(', ')})` : ""

        node.getElementById("name").innerHTML = move.name
        node.getElementById("flags").innerHTML = flagsString
        node.getElementById("type").src = getTypeImgSrc(move.type)
        node.getElementById("split").src = getTypeImgSrc(move.category)
        node.getElementById("power").innerHTML = powerText
        node.getElementById("acc").innerHTML = accText
        node.getElementById("pp").innerHTML = move.pp
        node.getElementById("prio").innerHTML = prioText
        node.getElementById("description").innerHTML = move.description
        tbody.append(node)
    })
}

function buildPokemonUI(pokemon, abilities, tribes) {
    const template = getTemplate("pokemonRowTemplate")
    const table = document.getElementById("pokemonTable")

    pokemon.forEach(mon => {
        let node = template.cloneNode(true)
        let monAbilities = mon.abilities.map(x => {
            const ability = abilities.get(x)
            return buildSpanWithTooltip(ability.name, ability.description)
        })
        let monTribes = mon.tribes.map(x => {
            const tribe = tribes.get(x)
            return buildSpanWithTooltip(tribe.name, tribe.description)
        })

        node.getElementById("key").value = mon.key
        node.getElementById("icon").src = getPokemonImgSrc(mon.key)
        node.getElementById("name").innerHTML = mon.name
        node.getElementById("type1").src = getTypeImgSrc(mon.type1)
        if (mon.type2.length > 0) {
            node.getElementById("type2").src = getTypeImgSrc(mon.type2)
        }
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

function showPokemonModal(elementWithKey) {
    const pokemon = tectonicData.pokemon.get(elementWithKey.querySelector("#key").value)
    const firstEvo = tectonicData.pokemon.get(pokemon.firstEvolution)

    const statsTemplate = getTemplate("pokemonStatsTemplate")
    const evoTemplate = getTemplate("pokemonEvolutionTemplate")

    const dialog = document.getElementById("pokemonModal")
    const type2 = dialog.querySelector("#type2")
    const evolutionRow = dialog.querySelector("#evolutionRow")

    dialog.querySelector("#name").innerHTML = pokemon.name
    dialog.querySelector("#type1").src = getTypeImgSrc(pokemon.type1)
    if (pokemon.type2.length > 0) {
        type2.classList.remove("gone")
        type2.src = getTypeImgSrc(pokemon.type2)
    } else {
        type2.classList.add("gone")
    }
    dialog.querySelector("#img").src = getPokemonImgSrc(pokemon.key)

    const statsTable = statsTemplate.cloneNode(true)
    const statsTableCell = dialog.querySelector("#statsTableCell")
    setStatRowData(statsTable, "hp", pokemon.hp, 1)
    setStatRowData(statsTable, "attack", pokemon.attack, 1)
    setStatRowData(statsTable, "defense", pokemon.defense, 1)
    setStatRowData(statsTable, "spa", pokemon.spAttack, 1)
    setStatRowData(statsTable, "spd", pokemon.spDefense, 1)
    setStatRowData(statsTable, "speed", pokemon.speed, 1)
    setStatRowData(statsTable, "bst", pokemon.bst, 6)
    statsTableCell.innerHTML = ""
    statsTableCell.append(statsTable)

    let evolutionTree = []
    recursivelyGetEvolutionUI(evoTemplate, evolutionTree, 0, firstEvo, null)
    evolutionRow.innerHTML = ""
    if (evolutionTree.length > 1) {
        evolutionTree.forEach(phase => {
            let cell = evolutionRow.insertCell(evolutionRow.cells.length)
            let phaseTable = document.createElement("table")
            phase.forEach(node => {
                row = phaseTable.insertRow(phaseTable.rows.length)
                row.classList.add("evolutionsTableRow")
                row.append(node)

                return row
            })

            cell.append(phaseTable)
        })
    } else {
        evolutionRow.innerHTML = "Does not evolve";
    }

    currentModalMovesThead = null
    dialog.querySelector("#moveMonKey").value = pokemon.key
    buildMovesUIMon(dialog.querySelector("#monModalType"))

    dialog.showModal()
}

function setStatRowData(table, stat, statValue, scale) {
    table.querySelector(`#${stat}Stat`).innerHTML = statValue

    const div = table.querySelector(`#${stat}Bar`)
    const scaledStatValue = (statValue / scale)
    div.style.width = `${Math.round(scaledStatValue * 2.0)}px`

    let colorDeg = Math.min(scaledStatValue * (0.45 + (scaledStatValue / 200)), 280)
    div.style.backgroundColor = `hsl(${colorDeg}deg, 100%, 50%)`
}

function recursivelyGetEvolutionUI(evoTemplate, nodes, depth, mon, howToEvo) {
    if (nodes.length == depth) {
        nodes.push([])
    }

    let node = evoTemplate.cloneNode(true)
    let nodeMethod = node.getElementById("method")
    node.getElementById("key").value = mon.key
    node.getElementById("icon").src = getPokemonImgSrc(mon.key)
    node.getElementById("name").innerHTML = mon.name
    nodeMethod.innerHTML = ""
    if (howToEvo != null) {
        if (howToEvo.method == "Item") {
            const item = tectonicData.items.get(howToEvo.condition)
            const itemTemplate = getTemplate("pokemonItemEvoTemplate").cloneNode(true)

            itemTemplate.getElementById("icon").src = getItemImgSrc(item.key)
            itemTemplate.getElementById("name").innerHTML = ` → ${item.name} → `
            nodeMethod.append(itemTemplate)
        } else if (howToEvo.method == "Level") {
            nodeMethod.innerHTML = ` → At level ${howToEvo.condition} → `
        } else {
            nodeMethod.innerHTML = ` → ${howToEvo.method} <br> at level ${howToEvo.condition} → `
        }
    }

    nodes[depth].push(node)
    mon.evolutions.forEach(evo => {
        const evoMon = tectonicData.pokemon.get(evo.pokemon)
        recursivelyGetEvolutionUI(evoTemplate, nodes, depth + 1, evoMon, evo)
    })
}

///////////////////////////////
// Helpers
///////////////////////////////
function getTemplate(id) {
    return document.getElementById(id).content
}

function setDialogClickListener(id) {
    const dialog = document.getElementById(id)
    dialog.addEventListener('click', event => {
        if (event.target === dialog) {
            dialog.close()
        }
    })
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
setDialogClickListener("pokemonModal")
main()