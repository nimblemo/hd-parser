const cheerio = require('cheerio');
const fs = require('fs');

const html = fs.readFileSync('analyzed_page.html', 'utf-8');
const $ = cheerio.load(html);

function cleanText(text) {
    if (!text) return null;
    return text.replace(/\[\s*обсудить[^\]]*\]/gis, '').replace(/\s+/g, ' ').trim() || null;
}

const profile = {};

// 1. Core Tags
const mainTags = $('.hd-tags-list .main-tags a');
profile.type = cleanText(mainTags.eq(0).text());
profile.profile = cleanText(mainTags.eq(1).text());
profile.cross = cleanText(mainTags.eq(2).text());

const secondaryTags = $('.hd-tags-list div').not('.main-tags').find('a');
profile.authority = cleanText(secondaryTags.eq(0).text());
profile.definition = cleanText(secondaryTags.eq(1).text());

// 2. Channels
profile.channels = [];
$('.hd-user-channel').each((i, el) => {
    const span = $(el).find('span').first().text().trim();
    const match = span.match(/^([\d]+-[\d]+)\.\s*(.+)$/);
    profile.channels.push({
        id: match ? match[1] : span,
        name: match ? match[2] : span,
        description: cleanText($(el).clone().children('span').remove().end().text())
    });
});

// 3. Behavioral Centers
profile.behaviorCenters = [];
const behaviorHeader = $('h4').filter((i, el) => $(el).text().trim() === 'Поведение');
if (behaviorHeader.length)
{
    const behaviorSection = behaviorHeader.parent();
    behaviorSection.children('div').each((i, el) => {
        const $div = $(el);
        const titleLink = $div.find('.clearfix a').text().trim();
        if (!titleLink) return;

        const parts = titleLink.split(/\s*—\s*/);
        const name = parts[0].trim();
        const status = parts[1] ? parts[1].trim() : null;

        const detailsDiv = $div.find('div').not('.clearfix').first();
        const normalText = cleanText(detailsDiv.find('div').filter((j, inner) => $(inner).text().includes('Нормальное поведение')).text().replace('Нормальное поведение:', ''));
        const distortedText = cleanText(detailsDiv.find('div').filter((j, inner) => $(inner).text().includes('Искаженное поведение')).text().replace('Искаженное поведение:', ''));

        profile.behaviorCenters.push({
            name,
            status,
            normalBehavior: normalText,
            distortedBehavior: distortedText
        });
    });
}

// 4. Simple Text Sections
profile.decisionMaking = cleanText($('h4').filter((i, el) => $(el).text().trim() === 'Принятие решений').parent().find('div').first().text());
profile.circuits = cleanText($('h4').filter((i, el) => $(el).text().trim() === 'Контуры').parent().find('div').first().text());

// 5. Gate-indexed lists (Fears, Sexuality, Love, Business)
function parseGateList(headerTitle) {
    const list = [];
    const header = $('h4').filter((i, el) => $(el).text().trim() === headerTitle);
    if (!header.length) return list;

    // Items are divs with margin-bottom: 40px
    header.parent().find('div[style*="margin-bottom: 40px"]').each((i, el) => {
        const $el = $(el);
        const title = cleanText($el.find('span').text());
        const desc = cleanText($el.clone().find('span').remove().end().text());
        if (title || desc)
        {
            list.push({ title, description: desc });
        }
    });
    return list;
}

profile.fears = parseGateList('Страхи');
profile.sexualityMechanics = parseGateList('Механика сексуальности');
profile.loveMechanics = parseGateList('Механика любви');
profile.businessSkills = parseGateList('Бизнес навыки');

// 6. Generic Meta Sections (Diet, Motivation, Vision, Environment)
function parseMetaSection(headerTitle) {
    const items = [];
    const header = $('h4').filter((i, el) => $(el).text().trim() === headerTitle);
    if (!header.length) return items;

    header.parent().find('p').each((i, el) => {
        const $p = $(el);
        const label = cleanText($p.find('span').text());
        const desc = cleanText($p.clone().find('span').remove().end().text());
        if (label || desc)
        {
            items.push({ label, description: desc });
        }
    });
    return items;
}

profile.dietaryRecommendations = parseMetaSection('Рекомендации по питанию');
profile.motivation = parseMetaSection('Мотивация');
profile.vision = parseMetaSection('Видение');
profile.environment = parseMetaSection('Окружение');

// 7. Stable Traits
profile.stableTraits = [];
const stableTraitsHeader = $('h4').filter((i, el) => $(el).text().trim() === 'Устойчивые черты');
if (stableTraitsHeader.length)
{
    stableTraitsHeader.parent().find('div[style*="margin-bottom: 40px"]').each((i, el) => {
        const text = cleanText($(el).text());
        if (text) profile.stableTraits.push(text);
    });
}

fs.writeFileSync('debug_profile.json', JSON.stringify(profile, null, 2));
console.log('Profile debug data saved to debug_profile.json');
