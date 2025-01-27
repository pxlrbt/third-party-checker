#!/usr/bin/env node

'use strict';

const meow = require('meow');
const crawl = require('./lib/crawl');
const YAML = require('yaml')
const fs = require('fs')
const ora = require('ora')
const puppeteer = require('puppeteer');


async function main() {
    const cli = meow(
        `
        Usage
            $ third-party-checker [INPUT]

        Options
	        --crawl, -c  Crawl all subpages
	        --similar, -s  Max number of similar pages to crawl
        `, {
            flags: {
                crawl: {
                    type: 'boolean',
                    alias: 'c',
                },
                similar: {
                    type: 'number',
                    alias: 's',
                    default: 10,
                }
            }
        },
    );

    if (cli.input.length < 1) {
        cli.showHelp();
        process.exit(0);
    }

    let start = +new Date();
    console.log('Started:', new Date().toLocaleTimeString())

    let inputFile = cli.input[0];
    let outputFile = 'report/all.yml';

    let sites = YAML.parse(fs.readFileSync(inputFile, 'utf8'));
    let siteData = {};

    for (let site of sites) {
        const baseUrl = site
            .replace(/^https?:\/\//, '')
            .replace(/^www\./, '');

        const siteWithProtocol = `https://${baseUrl}`
        const siteWithProtocolAndWWW = `https://www.${baseUrl}`

        let subpages = [];
        let allThirdPartyRequests = [];

        const spinner = ora(`${site}: Crawling`).start();

        if (cli.flags.crawl) {
            subpages = await crawl(siteWithProtocol, {
                limitSimilar: cli.flags.similar,
            });
        } else {
            subpages = ['/'];
        }

        spinner.text = `${site}: Scanning for third party requests`;

        const browser = await puppeteer.launch();
        const page = await browser.newPage();

        let scannedSubpages = 0;
        let siteStart = +new Date();

        // Get all 3rd party requests
        for (let subpage of subpages) {
            try {
                await page.goto(siteWithProtocol + subpage);
            } catch (e) {
                continue;
            }

            const requests = await page.evaluate(() => {
                return window.performance.getEntriesByType('resource').map(r => ({url: r.name, type: r.initiatorType}));
            });

            const thirdPartyRequests = requests
                .filter(r => ['xmlhttprequest', 'beacon'].indexOf(r.type) < 0)

                .filter(r => ! (r.url.startsWith(siteWithProtocol)
                    || r.url.startsWith(siteWithProtocolAndWWW)
                    || r.url.startsWith('data:')
                ))
                .map(r => r.url)


            allThirdPartyRequests = [...new Set([...thirdPartyRequests, ...allThirdPartyRequests])];
            spinner.text = `${site}: Scanning for third party requests (${allThirdPartyRequests.length} found | ${++scannedSubpages}/${subpages.length} pages scanned)`;
        }

        if (allThirdPartyRequests.length > 0) {
            spinner.warn(`${site}: ${allThirdPartyRequests.length} third party requests found [${(new Date() - siteStart) / 1000}s]`);
        } else {
            spinner.succeed(`${site}: No third party requests found [${(new Date() - siteStart) / 1000}s]`);
        }

        const data = {
            url: site,
            total: allThirdPartyRequests.length,
            googleFonts: allThirdPartyRequests.filter(url => url.includes('fonts.googleapis.com')).length ? 'YES' : 'NO',
            googleAnalytics: allThirdPartyRequests.filter(url => url.includes('fonts.googleapis.com')).length ? 'YES' : 'NO',
            requests: allThirdPartyRequests,
        }

        siteData[site] = data

        fs.writeFileSync(
            'report/' + site + '.yml',
            YAML.stringify(data),
        )

        browser.close();
    }

    fs.writeFileSync(
        outputFile,
        YAML.stringify(siteData),
    )

    console.log('Finished:', new Date().toLocaleTimeString())
    console.log('Total time:', new Date(+new Date() - start).toISOString().substr(11, 8))
}

main();
