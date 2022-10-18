# Third Party Checker

Tool for crawling a website and checking for third party requests using puppeteer.

## Installation

```bash
git clone https://github.com/pxlrbt/third-party-checker.git
cd third-party-checker
npm install
```

## Usage
- Create a `sites.yml` with a list of all sites.
- Make the file executable `chmod +x third-party-checker.js`.
- Run `./third-party-checker.js sites.yml`.

## Sites.yml
```yml
- domain-a.com
- domain-b.com
```

## Output
The script will generate a yml file for every site in `sites.yml` in `report/` and a combined file `report/all.yml`
