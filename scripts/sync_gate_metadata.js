const fs = require('fs');

const path = require('path');
const mdContent = fs.readFileSync(path.join(__dirname, '../data/gates.md'), 'utf-8');
const jsonContent = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/gates_to_centers.json'), 'utf-8'));

// Parse markdown table
// Example: | 1 | **41** | Сжатие | Корневой | Водолей | $0^\circ 00' 00''$ | $5^\circ 37' 30''$ |
const lines = mdContent.split('\n');
lines.forEach(line => {
    const match = line.match(/\|\s*\d+\s*\|\s*\*\*(\d+)\*\*\s*\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|\s*\$([^$]+)\$\s*\|\s*\$([^$]+)\$/);
    if (match)
    {
        const gateId = match[1];
        const zodiac = match[4].trim();
        const startDegree = match[5].trim();

        const formatDegree = (deg) => {
            return deg
                .replace(/\^\\circ/g, '°')
                .replace(/''/g, '"')
                .replace(/\\circ/g, '°'); // Handle both ^\circ and \circ
        };

        if (jsonContent[gateId])
        {
            jsonContent[gateId].zodiac = zodiac;
            jsonContent[gateId].startDegree = formatDegree(startDegree);
        }
    }
});

fs.writeFileSync(path.join(__dirname, '../data/gates_to_centers.json'), JSON.stringify(jsonContent, null, 4), 'utf-8');
console.log('Successfully updated gates_to_centers.json with degrees and zodiac signs.');
