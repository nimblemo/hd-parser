/**
 * merge_gates.js
 * 
 * Aggregates data from all JSON files in profiles/ directory.
 * Builds a unified gates_database.json with all gates, lines, channels, centers, and metadata.
 */

const fs = require('fs');
const path = require('path');

const PROFILES_DIR = path.join(__dirname, '../data/profiles');
const OUTPUT_FILE = path.join(__dirname, '../data/gates_database.json');
const GATES_TO_CENTERS_FILE = path.join(__dirname, '../data/gates_to_centers.json');

const TONE_MAP = {
    "Запах": "1",
    "Вкус": "2",
    "Внешнее зрение": "3",
    "Внутреннее зрение": "4",
    "Медитация": "4",
    "Чувства": "5",
    "Электромагнитные поля": "5",
    "Прикосновение": "6",
    "Экстрасенсорика": "6"
};

function cleanDescription(text) {
    if (!text) return text;

    // Replace egor-mikheev and conjugate verbs
    const replacements = [
        [/egor-mikheev следует/gi, "Вы следуете"],
        [/egor-mikheev умеет/gi, "Вы умеете"],
        [/egor-mikheev защищает/gi, "Вы защищаете"],
        [/egor-mikheev борется/gi, "Вы боретесь"],
        [/egor-mikheev чувствует/gi, "Вы чувствуете"],
        [/egor-mikheev желает/gi, "Вы желаете"],
        [/egor-mikheev может/gi, "Вы можете"],
        [/egor-mikheev проявляет/gi, "Вы проявляете"],
        [/egor-mikheev сидит и философствует/gi, "Вы сидите и философствуете"],
        [/egor-mikheev стремится/gi, "Вы стремитесь"],
        [/egor-mikheev все время пытается/gi, "Вы все время пытаетесь"],
        [/egor-mikheev любознательный человек/gi, "Вы — любознательный человек"],
        [/egor-mikheev выражает/gi, "Вы выражаете"],
        [/egor-mikheev обладает/gi, "Вы обладаете"],
        [/egor-mikheev имеет/gi, "Вы имеете"],
        [/egor-mikheev влияет/gi, "Вы влияете"],
        [/egor-mikheev смотрит/gi, "Вы смотрите"],
        [/egor-mikheev — рассказчик/gi, "Вы — рассказчик"],
        [/egor-mikheev — человек-критик/gi, "Вы — человек-критик"],
        [/egor-mikheev с чутьем/gi, "Вы с чутьем"],
        [/egor-mikheev оказывает/gi, "Вы оказываете"],
        [/egor-mikheev мастер на все руки/gi, "Вы — мастер на все руки"],
        [/egor-mikheev хороший организатор/gi, "Вы — хороший организатор"],
        [/egor-mikheev/gi, "Вы"], // Fallback
        [/у egor-mikheev/gi, "У вас"],
        [/egor-mikheev, у вас/gi, "У вас"]
    ];

    let cleaned = text;
    for (const [regex, replacement] of replacements)
    {
        cleaned = cleaned.replace(regex, replacement);
    }

    // Fix double spaces or leading/trailing whitespace
    return cleaned.replace(/\s+/g, ' ').trim();
}

function merge() {
    if (!fs.existsSync(PROFILES_DIR))
    {
        console.error('Directory "profiles" not found.');
        return;
    }

    let gatesToCentersMap = {};
    if (fs.existsSync(GATES_TO_CENTERS_FILE))
    {
        try
        {
            gatesToCentersMap = JSON.parse(fs.readFileSync(GATES_TO_CENTERS_FILE, 'utf-8'));
            console.log(`Loaded ${Object.keys(gatesToCentersMap).length} gate-to-center mappings from ${GATES_TO_CENTERS_FILE}.`);
        } catch (error)
        {
            console.error(`Error reading or parsing ${GATES_TO_CENTERS_FILE}:`, error.message);
        }
    }

    const files = fs.readdirSync(PROFILES_DIR).filter(f => f.endsWith('.json'));
    console.log(`🔍 Processing ${files.length} files...`);

    const db = {
        gates: {},           // keys: "1".."64"
        channels: {},        // keys: "10-34" etc.
        centers: {},         // keys: "Корневой Центр" etc.
        types: {},           // keys: "Манифестирующий генератор" etc.
        profiles: {},        // keys: "1/3" etc.
        authorities: {},     // keys: "Солнечное сплетение" etc.
        crosses: {},         // keys: "Правоугольный Крест Напряжения" etc.
        fears: {},           // keys: titles
        sexuality: {},       // keys: titles
        loveMechanics: {},   // keys: titles
        businessSkills: {},  // keys: titles
        diet: { colors: {}, tones: {} },
        motivation: { colors: {}, tones: {} },
        vision: { colors: {}, tones: {} },
        environment: { colors: {}, tones: {} },
        stableTraits: {}     // keys: gate IDs
    };

    files.forEach(file => {
        const filePath = path.join(PROFILES_DIR, file);
        const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

        // 1. Gates and Lines
        const processGates = (gatesArr) => {
            if (!gatesArr) return;
            gatesArr.forEach(g => {
                if (!db.gates[g.id])
                {
                    db.gates[g.id] = {
                        id: g.id,
                        name: g.name,
                        description: cleanDescription(g.gateDescription),
                        lines: {},
                        crosses: []
                    };
                    if (gatesToCentersMap[g.id])
                    {
                        const meta = gatesToCentersMap[g.id];
                        db.gates[g.id].center = meta.center;
                        db.gates[g.id].zodiac = meta.zodiac;
                        db.gates[g.id].startDegree = meta.startDegree;
                    }
                }
                if (g.lineNumber && g.lineDescription)
                {
                    db.gates[g.id].lines[g.lineNumber] = cleanDescription(g.lineDescription);
                }
            });
        };
        processGates(data.personalityGates);
        processGates(data.designGates);

        if (data.cross && data.cross.name && data.personalityGates && data.personalityGates.length > 0)
        {
            const sunGateId = data.personalityGates[0].id;
            if (db.gates[sunGateId])
            {
                if (!db.gates[sunGateId].crosses.includes(data.cross.name))
                {
                    db.gates[sunGateId].crosses.push(data.cross.name);
                }
            }
        }

        // 2. Channels
        if (data.channels)
        {
            data.channels.forEach(ch => {
                if (!db.channels[ch.id])
                {
                    db.channels[ch.id] = {
                        name: ch.name,
                        description: cleanDescription(ch.description)
                    };
                }
            });
        }

        // 3. Centers
        if (data.behaviorCenters)
        {
            data.behaviorCenters.forEach(c => {
                if (!db.centers[c.name])
                {
                    db.centers[c.name] = {
                        normalBehavior: c.normalBehavior,
                        distortedBehavior: c.distortedBehavior
                    };
                }
            });
        }

        // 4. Nested Meta Objects
        const keyMap = {
            type: 'types',
            profile: 'profiles',
            cross: 'crosses',
            authority: 'authorities'
        };
        Object.keys(keyMap).forEach(key => {
            if (data[key] && data[key].name)
            {
                const dbKey = keyMap[key];
                if (!db[dbKey][data[key].name])
                {
                    db[dbKey][data[key].name] = cleanDescription(data[key].description);
                }
            }
        });

        // 5. Specialized Gate Descriptions
        const processSpecializedList = (list, fieldName) => {
            if (!list) return;
            list.forEach(item => {
                const match = item.title.match(/(\d+)\s+ворота\.?\s*(.*)/);
                if (match)
                {
                    const gateId = match[1];
                    const subTitle = match[2] ? match[2].trim() : "";
                    if (db.gates[gateId] && !db.gates[gateId][fieldName])
                    {
                        db.gates[gateId][fieldName] = {
                            title: subTitle,
                            description: cleanDescription(item.description)
                        };
                    }
                }
            });
        };
        processSpecializedList(data.fears, 'fear');
        processSpecializedList(data.sexualityMechanics, 'sexuality');
        processSpecializedList(data.loveMechanics, 'love');
        processSpecializedList(data.businessSkills, 'business');

        // 6. Meta Sections (Diet, Motivation, Vision, Environment) - PHS
        const processPHS = (list, dbKey) => {
            if (!list) return;
            for (let i = 0; i < list.length; i++)
            {
                const item = list[i];
                let label = item.label;

                if (label === null && i > 0)
                {
                    label = list[i - 1].label;
                }

                if (!label) continue;

                let subKey = 'colors';
                let cleanKey = '';

                if (label.toLowerCase().includes('цвет'))
                {
                    subKey = 'colors';
                    cleanKey = label.replace(/\s*цвет/gi, '').trim();
                } else if (label.toLowerCase().includes('тон'))
                {
                    subKey = 'tones';
                    cleanKey = label.replace(/\s*тон/gi, '').trim();
                } else if (TONE_MAP[label])
                {
                    subKey = 'tones';
                    cleanKey = TONE_MAP[label];
                } else
                {
                    subKey = 'colors';
                    cleanKey = label;
                }

                const isGeneric = label.match(/^\d+\s+(цвет|тон)$/i);
                const description = cleanDescription(item.description);

                if (!db[dbKey][subKey][cleanKey])
                {
                    if (isGeneric)
                    {
                        db[dbKey][subKey][cleanKey] = description;
                    } else
                    {
                        db[dbKey][subKey][cleanKey] = {
                            name: label,
                            description: description
                        };
                    }
                } else
                {
                    const current = db[dbKey][subKey][cleanKey];
                    const currentDesc = typeof current === 'string' ? current : current.description;

                    if (description && description.length > (currentDesc || "").length)
                    {
                        if (typeof current === 'string')
                        {
                            db[dbKey][subKey][cleanKey] = description;
                        } else
                        {
                            db[dbKey][subKey][cleanKey].description = description;
                        }
                    }

                    if (!isGeneric)
                    {
                        if (typeof db[dbKey][subKey][cleanKey] === 'string')
                        {
                            db[dbKey][subKey][cleanKey] = {
                                name: label,
                                description: db[dbKey][subKey][cleanKey]
                            };
                        } else
                        {
                            db[dbKey][subKey][cleanKey].name = label;
                        }
                    }
                }
            }
        };
        processPHS(data.dietaryRecommendations, 'diet');
        processPHS(data.motivation, 'motivation');
        processPHS(data.vision, 'vision');
        processPHS(data.environment, 'environment');

        // 7. Stable Traits
        if (data.stableTraits)
        {
            data.stableTraits.forEach(st => {
                if (!db.stableTraits[st.id])
                {
                    db.stableTraits[st.id] = cleanDescription(st.description);
                }
            });
        }
    });

    Object.keys(db.gates).forEach(gateId => {
        const sortedLines = {};
        Object.keys(db.gates[gateId].lines).sort().forEach(line => {
            sortedLines[line] = db.gates[gateId].lines[line];
        });
        db.gates[gateId].lines = sortedLines;
    });

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(db, null, 2), 'utf-8');
    console.log(`✅ Database saved to ${OUTPUT_FILE}`);
}

merge();
