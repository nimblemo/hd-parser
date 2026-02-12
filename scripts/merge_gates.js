/**
 * merge_gates.js
 * 
 * Aggregates data from all JSON files in profiles/ directory.
 * Builds a unified gates_database.json with all gates, lines, channels, centers, and metadata.
 * Also supports refactoring the existing database if no profiles are found.
 */

const fs = require('fs');
const path = require('path');

const PROFILES_DIR = path.join(__dirname, '../data/profiles');
const OUTPUT_FILE = path.join(__dirname, '../data/gates_database_ru.json');
const GATES_TO_CENTERS_FILE = path.join(__dirname, '../data/gates_to_centers.json');
const CIRCUITS_FILE = path.join(__dirname, '../data/circuits.json');

const CENTERS_MAP = {
    'Корневой Центр': 'root',
    'root_center': 'root',
    'Горловой Центр': 'throat',
    'горловой_центр': 'throat',
    'Селезеночный Центр': 'splenic',
    'центр_селезенки': 'splenic',
    'Сердечный Центр': 'heart',
    'центр_эго': 'heart',
    'Сакральный Центр': 'sacral',
    'Солнечное сплетение': 'solar_plexus',
    'эмоциональный_центр': 'solar_plexus',
    'Теменной Центр': 'head',
    'Аджна Центр': 'ajna',
    'аджна,_центр_ума': 'ajna',
    'Джи Центр': 'g',
    'центр_g': 'g'
};

const TYPES_MAP = {
    'Манифестирующий генератор': 'manifesting_generator',
    'Проектор': 'projector',
    'Генератор': 'generator',
    'Рефлектор': 'reflector',
    'Манифестор': 'manifestor'
};

const AUTHORITIES_MAP = {
    'Солнечное сплетение': 'emotional',
    'Сакральный авторитет': 'sacral',
    'Лунный авторитет': 'lunar',
    'Внешний авторитет': 'mental',
    'Джи авторитет': 'self_projected',
    'Селезеночный авторитет': 'splenic'
};

const CROSSES_MAP = {
    'Правоугольный Крест Напряжения': 'right_angle_cross_of_tension',
    'Левоугольный Крест Индивидуализма': 'left_angle_cross_of_individualism',
    'Правоугольный Крест Проникновения': 'right_angle_cross_of_penetration',
    'Левоугольный Крест Циклов': 'left_angle_cross_of_cycles',
    'Правоугольный Крест Майи': 'right_angle_cross_of_maya',
    'Левоугольный Крест Затмения': 'left_angle_cross_of_obscuration',
    'Правоугольный Крест Законов': 'right_angle_cross_of_laws',
    'Левоугольный Крест Отвлечения': 'left_angle_cross_of_distraction',
    'Правоугольный Крест Неожиданного': 'right_angle_cross_of_the_unexpected',
    'Левоугольный Крест Альфы': 'left_angle_cross_of_the_alpha',
    'Правоугольный Крест Четырех Путей': 'right_angle_cross_of_the_four_ways',
    'Левоугольный Крест Совершенствования': 'left_angle_cross_of_refinement',
    'Правоугольный Крест Сфинкса': 'right_angle_cross_of_the_sphinx',
    'Левоугольный Крест Масок': 'left_angle_cross_of_masks',
    'Правоугольный Крест Объяснения': 'right_angle_cross_of_explanation',
    'Крест джакста-позиции Принципов': 'juxtaposition_cross_of_principles',
    'Левоугольный Крест Революции': 'left_angle_cross_of_revolution',
    'Правоугольный Крест Инфицирования': 'right_angle_cross_of_contagion',
    'Левоугольный Крест Индустрии': 'left_angle_cross_of_industry',
    'Правоугольный Крест Спящего Феникса': 'right_angle_cross_of_the_sleeping_phoenix',
    'Левоугольный Крест Духа': 'left_angle_cross_of_spirit',
    'Правоугольный Крест Планирования': 'right_angle_cross_of_planning',
    'Левоугольный Крест Миграции': 'left_angle_cross_of_migration',
    'Правоугольный Крест Сознания': 'right_angle_cross_of_consciousness',
    'Левоугольный Крест Господства': 'left_angle_cross_of_dominion',
    'Правоугольный Крест Управления': 'right_angle_cross_of_governance',
    'Крест джакста-позиции Грации': 'juxtaposition_cross_of_grace',
    'Левоугольный Крест Информирования': 'left_angle_cross_of_informing',
    'Правоугольный Крест Эдема': 'right_angle_cross_of_eden',
    'Левоугольный Крест Плана': 'left_angle_cross_of_the_plane',
    'Правоугольный Крест Сосуда Любви': 'right_angle_cross_of_vessel_of_love',
    'Левоугольный Крест Целительства': 'left_angle_cross_of_healing',
    'Правоугольный Крест Служения': 'right_angle_cross_of_service',
    'Крест джакста-позиции Мнений': 'juxtaposition_cross_of_opinions',
    'Левоугольный Крест Посвящения': 'left_angle_cross_of_dedication',
    'Крест джакста-позиции Самовыражения': 'juxtaposition_cross_of_self_expression',
    'Левоугольный Крест Неповиновения': 'left_angle_cross_of_defiance',
    'Левоугольный Крест Интуиции': 'left_angle_cross_of_intuition',
    'Левоугольный Крест Интеллекта': 'left_angle_cross_of_intellect',
    'Правоугольный Крест Исцеления': 'right_angle_cross_of_healing'
};

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

    let cleaned = text;

    // Remove "Further" markers and specific name variants
    const replacements = [
        [/Далее\s*→/g, ""],
        [/\[подробнее\]/gi, ""],
        [/<br\s*\/?>/gi, " "],
        [/у (egor-mikheev|Егора Михеева|Егора|Михеева)/gi, "у вас"],
        [/с (egor-mikheev|Егором Михеевым|Егором|Михеевым)/gi, "с вами"],
        [/для (egor-mikheev|Егора Михеева|Егора|Михеева)/gi, "для вас"],
        [/от (egor-mikheev|Егора Михеева|Егора|Михеева)/gi, "от вас"],
        [/(egor-mikheev|Егор Михеев|Егор|Михеев) следует/gi, "Вы следуете"],
        [/(egor-mikheev|Егор Михеев|Егор|Михеев) умеет/gi, "Вы умеете"],
        [/(egor-mikheev|Егор Михеев|Егор|Михеев) защищает/gi, "Вы защищаете"],
        [/(egor-mikheev|Егор Михеев|Егор|Михеев) борется/gi, "Вы боретесь"],
        [/(egor-mikheev|Егор Михеев|Егор|Михеев) чувствует/gi, "Вы чувствуете"],
        [/(egor-mikheev|Егор Михеев|Егор|Михеев) желает/gi, "Вы желаете"],
        [/(egor-mikheev|Егор Михеев|Егор|Михеев) может/gi, "Вы можете"],
        [/(egor-mikheev|Егор Михеев|Егор|Михеев) проявляет/gi, "Вы проявляете"],
        [/(egor-mikheev|Егор Михеев|Егор|Михеев) сидит и философствует/gi, "Вы сидите и философствуете"],
        [/(egor-mikheev|Егор Михеев|Егор|Михеев) стремится/gi, "Вы стремитесь"],
        [/(egor-mikheev|Егор Михеев|Егор|Михеев) все время пытается/gi, "Вы все время пытаетесь"],
        [/(egor-mikheev|Егор Михеев|Егор|Михеев) любознательный человек/gi, "Вы — любознательный человек"],
        [/(egor-mikheev|Егор Михеев|Егор|Михеев) выражает/gi, "Вы выражаете"],
        [/(egor-mikheev|Егор Михеев|Егор|Михеев) обладает/gi, "Вы обладаете"],
        [/(egor-mikheev|Егор Михеев|Егор|Михеев) имеет/gi, "Вы имеете"],
        [/(egor-mikheev|Егор Михеев|Егор|Михеев) влияет/gi, "Вы влияете"],
        [/(egor-mikheev|Егор Михеев|Егор|Михеев) смотрит/gi, "Вы смотрите"],
        [/(egor-mikheev|Егор Михеев|Егор|Михеев) — рассказчик/gi, "Вы — рассказчик"],
        [/(egor-mikheev|Егор Михеев|Егор|Михеев) — человек-критик/gi, "Вы — человек-критик"],
        [/(egor-mikheev|Егор Михеев|Егор|Михеев) с чутьем/gi, "Вы с чутьем"],
        [/(egor-mikheev|Егор Михеев|Егор|Михеев) оказывает/gi, "Вы оказываете"],
        [/(egor-mikheev|Егор Михеев|Егор|Михеев) мастер на все руки/gi, "Вы — мастер на все руки"],
        [/(egor-mikheev|Егор Михеев|Егор|Михеев) хороший организатор/gi, "Вы — хороший организатор"],
        [/(egor-mikheev|Егор Михеев|Егор|Михеев), у вас/gi, "у вас"],
        [/(egor-mikheev|Егор Михеев|Егор|Михеев)/gi, "Вы"]
    ];

    for (const [regex, replacement] of replacements)
    {
        cleaned = cleaned.replace(regex, replacement);
    }

    // Fix capitalization at the start of sentences
    cleaned = cleaned.replace(/(^|[.!?]\s+)([а-я])/g, (match, p1, p2) => p1 + p2.toUpperCase());

    return cleaned.replace(/\s+/g, ' ').trim();
}

function getEnId(ruText, mapping) {
    if (mapping && mapping[ruText]) return mapping[ruText];
    if (!ruText) return ruText;
    return ruText
        .toLowerCase()
        .replace(/правоугольный крест/g, 'right_angle_cross_of')
        .replace(/левоугольный крест/g, 'left_angle_cross_of')
        .replace(/крест джакста-позиции/g, 'juxtaposition_cross_of')
        .trim()
        .replace(/\s+/g, '_');
}

function merge() {
    const files = fs.existsSync(PROFILES_DIR) ? fs.readdirSync(PROFILES_DIR).filter(f => f.endsWith('.json')) : [];

    let gatesToCentersMap = {};
    if (fs.existsSync(GATES_TO_CENTERS_FILE))
    {
        try
        {
            gatesToCentersMap = JSON.parse(fs.readFileSync(GATES_TO_CENTERS_FILE, 'utf-8'));
        } catch (e) {}
    }

    let circuitsData = {};
    if (fs.existsSync(CIRCUITS_FILE))
    {
        try
        {
            circuitsData = JSON.parse(fs.readFileSync(CIRCUITS_FILE, 'utf-8'));
        } catch (e) {}
    }

    let db;
    if (files.length > 0)
    {
        console.log(`🔍 Processing ${files.length} files...`);
        db = {
            gates: {},
            channels: {},
            centers: {},
            types: {},
            profiles: {},
            authorities: {},
            crosses: {},
            diet: { colors: {}, tones: {} },
            motivation: { colors: {}, tones: {} },
            vision: { colors: {}, tones: {} },
            environment: { colors: {}, tones: {} }
        };

        files.forEach(file => {
            const data = JSON.parse(fs.readFileSync(path.join(PROFILES_DIR, file), 'utf-8'));

            const processGates = (gatesArr) => {
                if (!gatesArr) return;
                gatesArr.forEach(g => {
                    if (!db.gates[g.id])
                    {
                        db.gates[g.id] = {
                            name: g.name,
                            description: cleanDescription(g.gateDescription),
                            lines: {},
                            crosses: []
                        };
                    }
                    if (g.lineNumber && g.lineDescription)
                    {
                        db.gates[g.id].lines[g.lineNumber] = cleanDescription(g.lineDescription);
                    }
                });
            };
            processGates(data.personalityGates || []);
            processGates(data.designGates || []);

            if (data.cross && data.cross.name && data.personalityGates && data.personalityGates.length > 0)
            {
                const sunGateId = data.personalityGates[0].id;
                if (db.gates[sunGateId])
                {
                    const crossId = getEnId(data.cross.name, CROSSES_MAP);
                    if (!db.gates[sunGateId].crosses.includes(crossId))
                    {
                        db.gates[sunGateId].crosses.push(crossId);
                    }
                }
            }

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

            if (data.behaviorCenters)
            {
                data.behaviorCenters.forEach(c => {
                    const enKey = CENTERS_MAP[c.name] || getEnId(c.name);
                    if (!db.centers[enKey])
                    {
                        db.centers[enKey] = {
                            name: c.name,
                            normal: cleanDescription(c.normalBehavior),
                            distorted: cleanDescription(c.distortedBehavior)
                        };
                    }
                });
            }

            const keyMap = {
                type: { dbKey: 'types', mapping: TYPES_MAP },
                profile: { dbKey: 'profiles', mapping: null },
                cross: { dbKey: 'crosses', mapping: CROSSES_MAP },
                authority: { dbKey: 'authorities', mapping: AUTHORITIES_MAP }
            };
            Object.keys(keyMap).forEach(key => {
                if (data[key] && data[key].name)
                {
                    const config = keyMap[key];
                    const enKey = config.mapping ? (config.mapping[data[key].name] || getEnId(data[key].name, config.mapping)) : data[key].name;
                    if (!db[config.dbKey][enKey])
                    {
                        db[config.dbKey][enKey] = {
                            name: data[key].name,
                            description: cleanDescription(data[key].description)
                        };
                    }
                }
            });

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

            const processPHS = (list, dbKey) => {
                if (!list) return;
                for (let i = 0; i < list.length; i++)
                {
                    const item = list[i];
                    let label = item.label || (i > 0 ? list[i - 1].label : null);
                    if (!label) continue;
                    let subKey = label.toLowerCase().includes('тон') || TONE_MAP[label] ? 'tones' : 'colors';
                    let cleanKey = label.replace(/\s*(цвет|тон)/gi, '').trim();
                    if (TONE_MAP[label]) cleanKey = TONE_MAP[label];
                    const desc = cleanDescription(item.description);
                    if (!db[dbKey][subKey][cleanKey])
                    {
                        db[dbKey][subKey][cleanKey] = desc;
                    } else if (desc && desc.length > (db[dbKey][subKey][cleanKey] || "").length)
                    {
                        db[dbKey][subKey][cleanKey] = desc;
                    }
                }
            };
            processPHS(data.dietaryRecommendations, 'diet');
            processPHS(data.motivation, 'motivation');
            processPHS(data.vision, 'vision');
            processPHS(data.environment, 'environment');
        });
    } else if (fs.existsSync(OUTPUT_FILE))
    {
        console.log(`🔄 No profiles found. Refactoring existing ${OUTPUT_FILE}...`);
        const originalData = fs.readFileSync(OUTPUT_FILE, 'utf-8');
        if (originalData.trim().length === 0 || originalData === '{}')
        {
            console.error('❌ Database file is empty. Cannot refactor.');
            return;
        }
        db = JSON.parse(originalData);
    }

    if (db)
    {
        // Shared Final Processing (Consistency for both new and refactored)
        delete db.stableTraits;
        ['fears', 'sexuality', 'loveMechanics', 'businessSkills'].forEach(key => delete db[key]);

        // Transform Meta Tables
        const transformTable = (key, mapping) => {
            if (!db[key]) return;
            const newTable = {};
            for (const ruKey in db[key])
            {
                const enKey = mapping ? (mapping[ruKey] || getEnId(ruKey, mapping)) : ruKey;
                const value = db[key][ruKey];
                newTable[enKey] = {
                    name: typeof value === 'object' ? (value.name || ruKey) : ruKey,
                    description: cleanDescription(typeof value === 'object' ? (value.description || value.gateDescription || value.normalBehavior || "") : value)
                };
                if (key === 'centers' && typeof value === 'object')
                {
                    newTable[enKey].normal = cleanDescription(value.normal || value.normalBehavior);
                    newTable[enKey].distorted = cleanDescription(value.distorted || value.distortedBehavior);
                }
            }
            db[key] = newTable;
        };
        transformTable('centers', CENTERS_MAP);
        transformTable('types', TYPES_MAP);
        transformTable('authorities', AUTHORITIES_MAP);
        transformTable('crosses', CROSSES_MAP);
        transformTable('profiles', null);

        // Clean PHS (Ensure flat strings)
        ['diet', 'motivation', 'vision', 'environment'].forEach(phsKey => {
            if (db[phsKey])
            {
                ['colors', 'tones'].forEach(sub => {
                    if (db[phsKey][sub])
                    {
                        for (const k in db[phsKey][sub])
                        {
                            const item = db[phsKey][sub][k];
                            const desc = typeof item === 'string' ? item : (item.description || "");
                            db[phsKey][sub][k] = cleanDescription(desc);
                        }
                    }
                });
            }
        });

        // Build Across-gate Mapping from Channels
        const acrossMap = {};
        if (db.channels)
        {
            Object.keys(db.channels).forEach(chId => {
                const gates = chId.split('-').map(g => g.trim());
                if (gates.length === 2)
                {
                    acrossMap[gates[0]] = parseInt(gates[1], 10);
                    acrossMap[gates[1]] = parseInt(gates[0], 10);
                }
            });
        }

        // Clean and Enrich Gates
        Object.keys(db.gates).forEach(gateId => {
            const gate = db.gates[gateId];
            delete gate.id;
            gate.description = cleanDescription(gate.description || gate.gateDescription);

            if (gatesToCentersMap[gateId])
            {
                const meta = gatesToCentersMap[gateId];
                if (meta.center) gate.center = meta.center;
                if (meta.zodiac) gate.zodiac = meta.zodiac;
                if (meta.startDegree) gate.startDegree = meta.startDegree;
            }

            if (acrossMap[gateId])
            {
                gate.across = acrossMap[gateId];
            }

            if (gate.lines)
            {
                const simplifiedLines = {};
                Object.keys(gate.lines).forEach(lineKey => {
                    const lineNum = lineKey.match(/\d+/);
                    const newKey = lineNum ? lineNum[0] : lineKey;
                    simplifiedLines[newKey] = cleanDescription(gate.lines[lineKey]);
                });
                const sortedLines = {};
                Object.keys(simplifiedLines).sort().forEach(line => {
                    sortedLines[line] = simplifiedLines[line];
                });
                gate.lines = sortedLines;
            }

            if (circuitsData.gateMapping && circuitsData.gateMapping[gateId])
            {
                const [circuit, sub] = circuitsData.gateMapping[gateId].split('/');
                gate.circuit = circuit;
                gate.subCircuit = sub;
            }

            if (gate.crosses)
            {
                gate.crosses = gate.crosses.map(c => getEnId(c, CROSSES_MAP));
            }

            ['fear', 'sexuality', 'love', 'business'].forEach(field => {
                if (gate[field])
                {
                    const desc = typeof gate[field] === 'string' ? gate[field] : (gate[field].description || "");
                    gate[field] = cleanDescription(desc);
                }
            });
        });

        // Clean Channels
        if (db.channels)
        {
            Object.keys(db.channels).forEach(id => {
                db.channels[id].description = cleanDescription(db.channels[id].description);
                if (circuitsData.channelMapping && circuitsData.channelMapping[id])
                {
                    const [circuit, sub] = circuitsData.channelMapping[id].split('/');
                    db.channels[id].circuit = circuit;
                    db.channels[id].subCircuit = sub;
                }
            });
        }

        if (circuitsData.circuits)
        {
            db.circuits = circuitsData.circuits;
        }

        fs.writeFileSync(OUTPUT_FILE, JSON.stringify(db, null, 2), 'utf-8');
        console.log(`✅ Database saved/refactored to ${OUTPUT_FILE}`);
    }
}

merge();
