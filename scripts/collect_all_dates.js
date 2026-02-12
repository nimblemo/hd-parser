const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');
const { wrapper } = require('axios-cookiejar-support');
const { CookieJar } = require('tough-cookie');

const OUTPUT_DIR = path.join(__dirname, '../data/profiles');
const DELAY_MS = 3000;
const UID = '490206968';
const BASE_URL = 'https://hd.dating';
const GEO_PARAMS = '&lat=51.507351&lng=-0.127660&country=UK&address=London';
const ORIGINAL_DATE = '02.02.2021';
const circuitsData = require('../data/circuits.json');

const jar = new CookieJar();
const client = wrapper(axios.create({
    jar,
    withCredentials: true,
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36'
    }
}));

const BROWSER_COOKIES = {
    'dd_bdfhyr': '6c66d247924f32d8b4ca01efc97be654',
    'PHPSESSID5': '7425705dbe8ea21e18021b9b995f66e5',
    '_csrf': 'liSwLf9WjNzDY6PclOEKCNKYfB0kgIM1'
};

async function initCookies() {
    for (const [name, value] of Object.entries(BROWSER_COOKIES))
    {
        await jar.setCookie(`${name}=${value}; Domain=hd.dating; Path=/`, BASE_URL);
    }
}

if (!fs.existsSync(OUTPUT_DIR))
{
    fs.mkdirSync(OUTPUT_DIR);
}

function cleanText(text) {
    if (!text) return null;
    return text.replace(/\[\s*обсудить[^\]]*\]/gis, '').replace(/\s+/g, ' ').trim() || null;
}

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function updateBirthData(dateStr) {
    const url = `${BASE_URL}/pl/hd/hd-user-info/my?userId=${UID}&dt=00-00-00-${dateStr}${GEO_PARAMS}`;
    console.log(`Updating birth data to: ${dateStr}`);
    await client.get(url);
}

function parseProfile(html) {
    const $ = cheerio.load(html);
    const profile = {};

    // Basic Info
    const mainTags = $('.hd-tags-list .main-tags a');
    profile.type = cleanText(mainTags.eq(0).text());
    profile.profile = cleanText(mainTags.eq(1).text());
    profile.cross = cleanText(mainTags.eq(2).text());

    const secondaryTags = $('.hd-tags-list div').not('.main-tags').find('a');
    profile.authority = cleanText(secondaryTags.eq(0).text());
    profile.definition = cleanText(secondaryTags.eq(1).text());

    // Channels
    profile.channels = [];
    $('.hd-user-channel').each((i, el) => {
        const span = $(el).find('span').first().text().trim();
        const match = span.match(/^([\d]+-[\d]+)\.\s*(.+)$/);
        const $clone = $(el).clone();
        $clone.find('span').remove();

        const id = match ? match[1] : span;
        const name = match ? match[2] : span;
        const description = cleanText($clone.text());

        let circuit = null;
        let subCircuit = null;

        if (circuitsData.channelMapping)
        {
            let mapKey = id;
            if (!circuitsData.channelMapping[mapKey])
            {
                const parts = id.split('-');
                if (parts.length === 2)
                {
                    mapKey = `${parts[1]}-${parts[0]}`;
                }
            }

            if (circuitsData.channelMapping[mapKey])
            {
                const [c, s] = circuitsData.channelMapping[mapKey].split('/');
                circuit = c;
                subCircuit = s;
            }
        }

        profile.channels.push({
            id,
            name,
            description,
            circuit,
            subCircuit
        });
    });

    // Behavior Centers
    profile.behaviorCenters = [];
    const behaviorHeader = $('h4').filter((i, el) => $(el).text().trim() === 'Поведение');
    if (behaviorHeader.length)
    {
        behaviorHeader.parent().children('div').each((i, el) => {
            const $div = $(el);
            const titleLink = $div.find('.clearfix a').text().trim();
            if (!titleLink) return;
            const parts = titleLink.split(/\s*—\s*/);
            const name = parts[0].trim();
            const status = parts[1] ? parts[1].trim() : null;
            const detailsDiv = $div.find('div').not('.clearfix').first();
            const normalText = cleanText(detailsDiv.find('div').filter((j, inner) => $(inner).text().includes('Нормальное поведение')).text().replace('Нормальное поведение:', ''));
            const distortedText = cleanText(detailsDiv.find('div').filter((j, inner) => $(inner).text().includes('Искаженное поведение')).text().replace('Искаженное поведение:', ''));
            profile.behaviorCenters.push({ name, status, normalBehavior: normalText, distortedBehavior: distortedText });
        });
    }

    profile.decisionMaking = cleanText($('h4').filter((i, el) => $(el).text().trim() === 'Принятие решений').parent().find('div').first().text());

    // Gate Lists Helper
    const parseGateList = (headerTitle) => {
        const list = [];
        const header = $('h4').filter((i, el) => $(el).text().trim() === headerTitle);
        if (!header.length) return list;
        header.parent().find('div[style*="margin-bottom: 40px"]').each((i, el) => {
            const $el = $(el);
            const title = cleanText($el.find('span').text());
            const $clone = $el.clone();
            $clone.find('span').remove();
            const desc = cleanText($clone.text());
            if (title || desc) list.push({ title, description: desc });
        });
        return list;
    };

    profile.fears = parseGateList('Страхи');
    profile.sexualityMechanics = parseGateList('Механика сексуальности');
    profile.loveMechanics = parseGateList('Механика любви');
    profile.businessSkills = parseGateList('Бизнес навыки');

    // Meta Sections Helper
    const parseMetaSection = (headerTitle) => {
        const items = [];
        const header = $('h4').filter((i, el) => $(el).text().trim() === headerTitle);
        if (!header.length) return items;
        header.parent().find('p').each((i, el) => {
            const $p = $(el);
            const label = cleanText($p.find('span').text());
            const $clone = $p.clone();
            $clone.find('span').remove();
            const desc = cleanText($clone.text());
            if (label || desc) items.push({ label, description: desc });
        });
        return items;
    };

    profile.dietaryRecommendations = parseMetaSection('Рекомендации по питанию');
    profile.motivation = parseMetaSection('Мотивация');
    profile.vision = parseMetaSection('Видение');
    profile.environment = parseMetaSection('Окружение');

    // Stable Traits (Fixed Selector)
    profile.stableTraits = [];
    const stableTraitsHeader = $('h4').filter((i, el) => $(el).text().trim() === 'Устойчивые черты');
    if (stableTraitsHeader.length)
    {
        stableTraitsHeader.closest('.hd-info').find('.user-gate').each((i, el) => {
            const $el = $(el);
            const id = cleanText($el.find('.gate-icon-title').text());
            const desc = cleanText($el.find('.gate-description').text());
            if (id || desc) profile.stableTraits.push({ id, description: desc });
        });
    }

    // Extended Gates Parsing (Personality & Design)
    const parseExtendedGates = (sectionTitle) => {
        const gates = [];
        const sectionHeader = $('#extended h4').filter((i, el) => $(el).text().trim() === sectionTitle);
        if (!sectionHeader.length) return gates;

        const container = sectionHeader.next('div');
        const children = container.children('div');

        for (let i = 0; i < children.length; i += 2)
        {
            const $gateDiv = $(children[i]);
            const $lineDiv = $(children[i + 1]);

            if ($gateDiv.css('margin-bottom') === '10px' || $gateDiv.attr('style')?.includes('margin-bottom: 10px'))
            {
                const id = cleanText($gateDiv.find('.gate-icon').text());
                const name = $gateDiv.find('.gate-icon').attr('title')?.trim() || null;
                const gateDescription = cleanText($gateDiv.find('.gate-description').text());

                let lineNumber = null;
                let lineDescription = null;

                if ($lineDiv.length && ($lineDiv.css('margin-bottom') === '30px' || $lineDiv.attr('style')?.includes('margin-bottom: 30px')))
                {
                    const $span = $lineDiv.find('.gate-description span');
                    lineNumber = cleanText($span.text());
                    lineDescription = cleanText($lineDiv.find('.gate-description').clone().find('span').remove().end().text());
                }

                gates.push({ id, name, gateDescription, lineNumber, lineDescription });
            }
        }
        return gates;
    };

    profile.personalityGates = parseExtendedGates('Личность');
    profile.designGates = parseExtendedGates('Дизайн');

    // Circuits & Groups (Fixed nested headers)
    const circuitsHeader = $('h4').filter((i, el) => $(el).text().trim() === 'Контуры');
    if (circuitsHeader.length)
    {
        const container = circuitsHeader.parent().find('div').first();
        const rawHtml = container.html() || '';
        const parts = rawHtml.split(/<h4>Группы контуров<\/h4>/i);

        const stripTags = (html) => cleanText($('<div>').html(html).text());

        profile.circuits = stripTags(parts[0]);
        profile.circuitGroups = parts[1] ? stripTags(parts[1]) : null;
    } else
    {
        profile.circuits = null;
        profile.circuitGroups = null;
    }

    return profile;
}

function parseFullDescription(html) {
    const $ = cheerio.load(html);
    const data = {};
    $('.hd-info-part').each((i, el) => {
        const title = $(el).find('h4').text().trim();
        const content = cleanText($(el).clone().find('h4').remove().end().text());
        if (title.includes('Кто я')) data.typeDesc = content;
        else if (title.includes('принимать решения')) data.strategyDesc = content;
        else if (title.includes('видят другие')) data.profileDesc = content;
        else if (title.includes('Основная сила')) data.crossDesc = content;
        else if (title.includes('зафиксировано')) data.definedCentersDesc = content;
        else if (title.includes('открыто')) data.openCentersDesc = content;
    });
    return data;
}

async function collect() {
    await initCookies();
    const start = new Date(2000, 0, 1);
    const end = new Date(2000, 11, 31);

    try
    {
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1))
        {
            const day = String(d.getDate()).padStart(2, '0');
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const year = d.getFullYear();
            const dateStr = `${day}-${month}-${year}`;
            const isoDate = `${year}-${month}-${day}`;
            const filename = path.join(OUTPUT_DIR, `${isoDate}.json`);

            if (fs.existsSync(filename)) continue;

            await updateBirthData(dateStr);
            await sleep(DELAY_MS);

            console.log(`Fetching profile for ${isoDate}...`);
            const profileRes = await client.get(`${BASE_URL}/lsp/profile?uid=${UID}`);
            const profileData = parseProfile(profileRes.data);

            console.log(`Fetching full description for ${isoDate}...`);
            const fullDescRes = await client.get(`${BASE_URL}/lsp/hd-full-description?uid=${UID}`);
            const fullDescData = parseFullDescription(fullDescRes.data);

            const finalData = {
                date: isoDate,
                type: {
                    name: profileData.type,
                    description: fullDescData.typeDesc
                },
                profile: {
                    name: profileData.profile,
                    description: fullDescData.profileDesc
                },
                cross: {
                    name: profileData.cross,
                    description: fullDescData.crossDesc
                },
                authority: {
                    name: profileData.authority,
                    description: fullDescData.strategyDesc
                },
                definition: profileData.definition,
                channels: profileData.channels,
                behaviorCenters: profileData.behaviorCenters,
                decisionMaking: profileData.decisionMaking,
                fears: profileData.fears,
                sexualityMechanics: profileData.sexualityMechanics,
                loveMechanics: profileData.loveMechanics,
                businessSkills: profileData.businessSkills,
                dietaryRecommendations: profileData.dietaryRecommendations,
                motivation: profileData.motivation,
                vision: profileData.vision,
                environment: profileData.environment,
                stableTraits: profileData.stableTraits,
                personalityGates: profileData.personalityGates,
                designGates: profileData.designGates,
                circuits: profileData.circuits,
                circuitGroups: profileData.circuitGroups,
                definedCentersDesc: fullDescData.definedCentersDesc,
                openCentersDesc: fullDescData.openCentersDesc
            };
            fs.writeFileSync(filename, JSON.stringify(finalData, null, 2));
            console.log(`Saved ${isoDate}.json`);

            await sleep(DELAY_MS);
        }
    } catch (err)
    {
        console.error('Error during collection:', err.message);
    } finally
    {
        console.log('Restoring original birthday...');
        await updateBirthData(ORIGINAL_DATE.replace(/\./g, '-'));
    }
}

collect();
