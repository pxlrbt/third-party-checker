# Third Party Checker

Tool for crawling websites and checking for third party requests using Puppeteer.

## Installation

```bash
git clone https://github.com/pxlrbt/third-party-checker.git
cd third-party-checker
npm install
```

## Usage
- Create a `sites.yml` with a list of sites.
- Make the file executable `chmod +x third-party-checker.js`.
- Create a `report` folder.
- Run `./third-party-checker.js sites.yml`.

### Crawler
The default command only checks the front page for third party request. If you want to crawl the whole page use the `--crawl` flag.

```sh
./third-party-checker.js --crawl sites.yml


## Sites.yml
```yml
- domain-a.com
- domain-b.com
```

## Output
The script will generate a yml file for every site in `sites.yml` in `report/` and a combined file `report/all.yml`
