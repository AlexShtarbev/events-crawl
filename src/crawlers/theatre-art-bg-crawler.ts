import { Dataset, KeyValueStore, Log, PlaywrightCrawler } from 'crawlee';
import { Page } from 'playwright';

const BASE_URL = 'https://theatre.art.bg/'

const KEY_VALYE_STORE = await KeyValueStore.open('urls');

const allLinksExtractor = new PlaywrightCrawler({
    launchContext: {
        // Here you can set options that are passed to the playwright .launch() function.
        launchOptions: {
            headless: true,
        },
    },

    // Only need one crawler
    maxRequestsPerCrawl: 2,

    async requestHandler({ request, page, enqueueLinks, log }) {
        log.info(`Processing ${request.url}`);

        const months = page.locator('div.change_month a');
        const monthsCount = await months.count();
        console.log(`Other months: ${monthsCount}`)


        if (request.url == BASE_URL) {
            const urls = []
            for (let index = 0; index < monthsCount; index++) {
                const month  = months.nth(index)
                const href = await month.getAttribute('href');
                urls.push(BASE_URL + href)
            }
        
            console.log(`${urls}`)
            // add the links for the other months
            await enqueueLinks({urls: urls})
        }

        // Change day of the month
        await getAllDaysOfMonthsUrls(page);
    },
})

async function getAllDaysOfMonthsUrls(page: Page) {
    const calendar = page.locator('div.calendar');
    const daysOfTheMonth = calendar.locator(':scope li');
    const daysOfTheMonthCount = await daysOfTheMonth.count();

    // skip all days before the current one
    let index = 0;
    while (await daysOfTheMonth.nth(index).getAttribute('class') != 'current') {
        index++;
    }

    // skip the current day
    index++;

    const nextLinks = [];
    for (; index < daysOfTheMonthCount; index++) {
        const linkOfEachDay = daysOfTheMonth.nth(index).locator(':scope a');
        const href = await linkOfEachDay.getAttribute('href');
        const dayNumber = await linkOfEachDay.innerText();
        nextLinks.push(BASE_URL + href);
        console.info(`${dayNumber}: ${href}`);
    }

    await KEY_VALYE_STORE.setValue('URLS', nextLinks);
}

// Create an instance of the PlaywrightCrawler class - a crawler
// that automatically loads the URLs in headless Chrome / Playwright.
const crawler = new PlaywrightCrawler({
    launchContext: {
        // Here you can set options that are passed to the playwright .launch() function.
        launchOptions: {
            headless: true,
        },
    },

    // Stop crawling after several pages
    maxRequestsPerCrawl: 50,

    // This function will be called for each URL to crawl.
    // Here you can write the Playwright scripts you are familiar with,
    // with the exception that browsers and pages are automatically managed by Crawlee.
    // The function accepts a single parameter, which is an object with a lot of properties,
    // the most important being:
    // - request: an instance of the Request class with information such as URL and HTTP method
    // - page: Playwright's Page object (see https://playwright.dev/docs/api/class-page)
    async requestHandler({ request, page, enqueueLinks, log }) {
        log.info(`Processing ${request.url}`);

        await extractPlaysData(page, log);

    },

    // This function is called if the page processing failed more than maxRequestRetries+1 times.
    failedRequestHandler({ request, log }) {
        log.info(`Request ${request.url} failed too many times.`);
    },
});

// Extracts the metadata about the plays for a specific day
async function extractPlaysData(page: Page, log: Log) {
    const tableWithPlays = page.locator("td.left").locator("#left");

    const rows = tableWithPlays.locator(':scope div.postanovka tr');
    const rowCount = await rows.count();
    log.info(`logs ${rowCount}`);

    if (rowCount == 0) {
        return
    }

    const links = rows.locator(":scope div.text h2 a");
    const linkCounts = await links.count();
    log.info(`links ${linkCounts}`);


    for (let index = 0; index < linkCounts; index++) {
        const link = links.nth(index);
        const href = await link.getAttribute("href");
        const title = await link.getAttribute("title");
        console.info(`${title}: ${href}`);
    }
}

// Call start
(async() => {
    await allLinksExtractor.addRequests([BASE_URL])
    await allLinksExtractor.run()
    const urls = await KEY_VALYE_STORE.getValue('URLS') as []

    await crawler.addRequests(urls);
    await crawler.run();

    console.log(await Dataset.getData())
  })();
