
const fs = require('fs');
const path = require('path');

const ruPath = path.join(__dirname, '../data/gates_database_ru.json');
const esPath = path.join(__dirname, '../data/gates_database_es.json');

const ruData = JSON.parse(fs.readFileSync(ruPath, 'utf8'));
const esData = JSON.parse(fs.readFileSync(esPath, 'utf8'));


const keysToTransferGates = ['center', 'circuit', 'subCircuit'];
const keysToTransferChannels = ['circuit', 'subCircuit'];

// Fix Gates
for (let i = 1; i <= 64; i++)
{
    const gateKey = i.toString();
    if (ruData.gates[gateKey] && esData.gates[gateKey])
    {
        keysToTransferGates.forEach(key => {
            if (ruData.gates[gateKey][key])
            {
                esData.gates[gateKey][key] = ruData.gates[gateKey][key];
            }
        });
    }
}

// Fix Channels
if (ruData.channels && esData.channels)
{
    Object.keys(ruData.channels).forEach(channelKey => {
        if (esData.channels[channelKey])
        {
            keysToTransferChannels.forEach(key => {
                if (ruData.channels[channelKey][key])
                {
                    esData.channels[channelKey][key] = ruData.channels[channelKey][key];
                }
            });
        }
    });
}

fs.writeFileSync(esPath, JSON.stringify(esData, null, 2), 'utf8');
console.log('Done!');
