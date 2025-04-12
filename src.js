///////////////////////////////
// Main Funcitonality
///////////////////////////////
async function main() {
    let tectonicFiles = []
    await Promise.all([
        fileFetch("PBS/types.txt")
    ]).then((values) => tectonicFiles.push(...values))
        .catch((error) => console.error(error))

    let tectonicData = [
        standardFilesParser([tectonicFiles[0]], parsePokemonTypes)
    ]

    console.log(tectonicData)
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
                    const value = line.substring(1, line.length - 2)
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

///////////////////////////////
// Helpers
///////////////////////////////
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
main();