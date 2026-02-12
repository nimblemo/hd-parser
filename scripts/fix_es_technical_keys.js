const fs = require('fs');
const path = require('path');

const enPath = path.join(__dirname, '../data/gates_database_en.json');
const esPath = path.join(__dirname, '../data/gates_database_es.json');

const enData = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const esData = JSON.parse(fs.readFileSync(esPath, 'utf8'));

const keysToTransfer = ['center', 'circuit', 'subCircuit'];

const translationMap = {
    'conocimiento': 'knowing',
    'abstracto': 'abstract',
    'colectivo': 'collective',
    'lógica': 'logic',
    'defensa': 'defense',
    'gramo': 'g',
    'individual': 'individual',
    'tribal': 'tribal',
    'ego': 'ego',
    'integration': 'integration',
    'head': 'head',
    'ajna': 'ajna',
    'throat': 'throat',
    'sacral': 'sacral',
    'root': 'root',
    'splenic': 'splenic',
    'solar_plexus': 'solar_plexus',
    'heart': 'heart',
    'self': 'g', // sometimes self is used for G
    'g': 'g'
};

function fixObject(esObj, enObj, id, type) {
    if (!esObj || !enObj) return;

    keysToTransfer.forEach(key => {
        // Priority 1: Copy from EN if available
        if (enObj[key])
        {
            esObj[key] = enObj[key];
        }

        // Priority 2: If still Spanish/Wrong in ES, try to translate or fix
        if (esObj[key] && translationMap[esObj[key].toLowerCase()])
        {
            esObj[key] = translationMap[esObj[key].toLowerCase()];
        }
    });
}

console.log('Fixing Gates...');
for (let i = 1; i <= 64; i++)
{
    const id = i.toString();
    fixObject(esData.gates[id], enData.gates[id], id, 'gate');
}

console.log('Fixing Channels...');
if (esData.channels)
{
    Object.keys(esData.channels).forEach(id => {
        fixObject(esData.channels[id], enData.channels ? enData.channels[id] : null, id, 'channel');
    });
}

fs.writeFileSync(esPath, JSON.stringify(esData, null, 2), 'utf8');
console.log('Done!');
