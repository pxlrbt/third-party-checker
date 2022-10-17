'use strict';

const baseCount = {};

module.exports = (url, limit) => {
    let base = url.replace(/\/$/, '')
                .split('/')
                .slice(0, -1)
                .join('/');

    if (base.length == 0) {
        return true;
    }

    if (! (base in baseCount)) {
        baseCount[base] = 0;
    }

    return baseCount[base]++ < limit;
}
