///////////////////////////////
// Main Funcitonality
///////////////////////////////
async function main() {
    let tectonicFiles = []
    await Promise.all([
        fileFetch("PBS/types.txt"),
        fileFetch("PBS/tribes.txt"),
    ]).then((values) => tectonicFiles.push(...values))
        .catch((error) => console.error(error))

    let types = standardFilesParser([tectonicFiles[0]], parsePokemonTypes)
    let tribes = parseTribes(tectonicFiles[1])

    let typeChart = buildTypeChart(types)
    buildTribes(tribes)
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
                    pairs.push({ key: "num", value: value })
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
            case "num":
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

function buildTribes(tribes) {
    const template = getTemplate("tribeRowTemplate")
    const table = document.getElementById("tribesTable")

    tribes.forEach(tribe => {
        let node = template.cloneNode(true)

        node.getElementById("name").innerHTML = tribe.name
        node.getElementById("description").innerHTML = tribe.description
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
let currentTab = document.getElementById("typeChart")
let currentTabButton = document.getElementById("typeChartButton")

main()