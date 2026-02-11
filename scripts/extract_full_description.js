const cheerio = require('cheerio');
const fs = require('fs');

const html = fs.readFileSync('test_full_description.html', 'utf-8');
const $ = cheerio.load(html);

const data = {};
function cleanText(text) {
    if (!text) return null;
    return text.replace(/\[\s*обсудить[^\]]*\]/gis, '').replace(/\s+/g, ' ').trim() || null;
}

$('.hd-info-part').each((i, el) => {
    const $section = $(el);
    const title = cleanText($section.find('h4').clone().children().remove().end().text());
    const description = cleanText($section.find('.f-desc').text());

    switch (i)
    {
        case 0: data.type = description; break;
        case 1: data.strategy = description; break;
        case 2: data.authority = description; break;
        case 3: data.profile = description; break;
        case 4: data.cross = description; break;
        case 5: data.definedCenters = description; break;
        case 6: data.openCenters = description; break;
        case 7: data.diet = { title, description }; break;
        case 8: data.environment = { title, description }; break;
    }
});

fs.writeFileSync('debug_full_description.json', JSON.stringify(data, null, 2));
console.log('Full description debug data saved to debug_full_description.json');
