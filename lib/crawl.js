'use strict';

const Crawler = require('simplecrawler');
const ora = require('ora');
const cliTruncate = require('cli-truncate');
const cheerio = require('cheerio');
const filterSimilar = require('./filter-similar');

const EXT_BLACKLIST = /(\?|page\/\d+|(\.pdf|\.js|\.css|\.png|\.jpg|\.jpeg|\.gif|\.json|\.xml|\.txt|\.zip|\.rar$))/i;
const SPINNER_WIDTH = 2;
let urls = [];

module.exports = (url, flags) => {
    return new Promise((resolve, reject) => {
        const start = +new Date();
        const crawler = new Crawler(url);
        const spinner = ora('Crawling...').start();
        const site = url.replace(/^https?:\/\//, '').replace(/^www\./, '');

        crawler.discoverResources = function(buffer) {
            const $ = cheerio.load(buffer.toString('utf8'));

            return $('a[href]')
                .map((i, el)  => $(el).attr('href'))
                .get();
        };

        crawler.stripQuerystring = true;

        if (flags.ignoreRobots) {
            crawler.respectRobotsTxt = false;
        }

        if (flags.ignoreSslErrors) {
            process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
            crawler.ignoreInvalidSSL = true;
        }

        if (flags.outfile) {
            outfile = flags.outfile;
        }

        if (flags.debug) {
            const errors = [
                'queueerror',
                'robotstxterror',
                'cookieerror',
                'fetchdataerror',
                'fetcherror',
                'gziperror',
            ];

            errors.forEach(error => {
                crawler.on(error, err => spinner.fail(err));
            });
        }

        if (flags.allowSubdomains) {
            crawler.scanSubdomains = true;
        }

        // Skip this small blacklist of extensions
        crawler.addFetchCondition(
            queueItem => !queueItem.path.match(EXT_BLACKLIST)
                            && filterSimilar(queueItem.path, flags.limitSimilar)
        );

        // Update spinner with current path
        crawler.on('fetchstart', queueItem => {
            const cols = Math.max(process.stdout.columns - SPINNER_WIDTH, 1);
            spinner.text = `${site}: ` + cliTruncate(queueItem.path, cols);
        });

        // If the document was html then add it to the list
        // This might not be necessary since we're filtering the
        // extensions above, and a local server may not be returning
        // the correct mimetypes/headers
        crawler.on('fetchcomplete', queueItem => {
            if (queueItem.stateData.contentType.indexOf('text/html') > -1) {
                urls.push(queueItem.path);
            }
        });

        // Done. Output the file
        crawler.on('complete', () => {
            spinner.succeed(`${site}: Found ${urls.length} urls [${(new Date() - start) / 1000}s]`);

            resolve(urls.sort())
        });

        crawler.start();
    });
}
