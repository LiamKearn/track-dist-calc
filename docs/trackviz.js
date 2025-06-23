// Horrifying shim to support `repeatEvent` in safari, probably breaks with 0.xx
// duration values.
if (navigator.vendor && navigator.vendor === 'Apple Computer, Inc.') {
    const old = SVGAnimationElement.prototype.addEventListener;
    SVGAnimationElement.prototype.addEventListener = function(type, listener, options) {
        if (type !== 'repeatEvent') {
            return old.call(this, type, listener, options);
        }

        const repeatCount = Number(this.getAttribute('repeatCount'));
        const duration = this.getSimpleDuration();
        let lastRepeat = 0;

        const cb = () => {
            const myTime = this.getCurrentTime() - this.getStartTime();
            if (myTime >= duration * repeatCount) {
                cancelAnimationFrame(cb);
                return;
            }

            const flooredTime = Math.floor(myTime);
            if (flooredTime !== 0 && flooredTime % duration === 0) {
                if (flooredTime > lastRepeat) {
                    lastRepeat = flooredTime;
                    this.dispatchEvent(new Event('repeatEvent'));
                }
            }

            requestAnimationFrame(cb);
        };

        this.addEventListener('beginEvent', () => requestAnimationFrame(cb));

        return old.call(this, 'repeatEvent', listener, options);
    };
}

function createLaneDef(laneNumber, pathData) {
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('id', `lane${laneNumber}-path`);
    path.setAttribute('d', pathData);
    return path;
}

function createLane(laneNumber) {
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'use');
    path.setAttribute('id', `lane${laneNumber}`);
    path.setAttribute('href', `#lane${laneNumber}-path`);
    path.setAttribute('stroke', 'red');
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke-width', '1');

    const topLane = document.createElementNS('http://www.w3.org/2000/svg', 'use');
    topLane.setAttribute('id', `lane${laneNumber}-top`);
    topLane.setAttribute('href', `#lane${laneNumber}-path`);
    topLane.setAttribute('stroke', 'none');
    topLane.setAttribute('stroke-dashoffset', '398.116');
    topLane.setAttribute('stroke-dasharray', '398.116');
    topLane.setAttribute('fill', 'none');
    topLane.setAttribute('stroke-width', '1.0');

    const animate = document.createElementNS('http://www.w3.org/2000/svg', 'animate');
    animate.setAttribute('attributeName', 'stroke-dashoffset');
    animate.setAttribute('from', '398.116');
    animate.setAttribute('to', '0');
    animate.setAttribute('dur', '10s');
    animate.setAttribute('fill', 'freeze');
    animate.setAttribute('repeatCount', '1');

    if (laneNumber === 1) {
        topLane.setAttribute('stroke', 'blue');
        topLane.appendChild(animate);
    }

    return [path, topLane];
}

// Duration is path based.
function animateLane(laneNumber, laps, duration, lapCB, endCB, color = 'blue') {
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('r', '1');
    circle.setAttribute('fill', color);
    const animateMotion = document.createElementNS('http://www.w3.org/2000/svg', 'animateMotion');
    animateMotion.setAttribute('dur', `${duration}s`);
    animateMotion.setAttribute('repeatCount', laps);
    animateMotion.lastRepeat = 0;
    animateMotion.addEventListener('repeatEvent', (ev) => {
        const split = document.querySelector('#splits');
        let mySplits = split.querySelector(`#${color}-${laneNumber}-split`);
        if (!mySplits) {
            const newSplit = document.createElement('table');
            newSplit.innerHTML = `<thead><tr><th colspan="2">${color}, Lane: ${laneNumber}</th></tr><tr><th>Lap</th><th>Time</th></tr></thead><tbody id="${color}-${laneNumber}-split"></tbody>`;
            split.appendChild(newSplit);
            mySplits = split.querySelector(`#${color}-${laneNumber}-split`);
        }
        const currentLap = document.querySelectorAll(`#${color}-${laneNumber}-split tr`).length + 1;
        const tr = document.createElement('tr');
        const tdLap = document.createElement('td');
        tdLap.textContent = currentLap;
        const tdTime = document.createElement('td');
        tdTime.textContent = ((ev.timeStamp - animateMotion.lastRepeat) / 1000).toFixed(2);
        tr.appendChild(tdLap);
        tr.appendChild(tdTime);
        mySplits.appendChild(tr);
        animateMotion.lastRepeat = ev.timeStamp;
    });
    if (lapCB) {
        animateMotion.addEventListener('repeatEvent', lapCB);
    }
    animateMotion.addEventListener('endEvent', (ev) => {
        const split = document.querySelector('#splits');
        let mySplits = split.querySelector(`#${color}-${laneNumber}-split`);
        if (!mySplits) {
            const newSplit = document.createElement('table');
            newSplit.innerHTML = `<thead><tr><th colspan="2">${color}, Lane: ${laneNumber}</th></tr><tr><th>Lap</th><th>Time</th></tr></thead><tbody id="${color}-${laneNumber}-split"></tbody>`;
            split.appendChild(newSplit);
            mySplits = split.querySelector(`#${color}-${laneNumber}-split`);
        }
        const p = laps % 1;
        const currentLap = document.querySelectorAll(`#${color}-${laneNumber}-split tr`).length + ((p === 0) ? 1 : p);
        const tr = document.createElement('tr');
        const tdLap = document.createElement('td');
        tdLap.textContent = currentLap;
        const tdTime = document.createElement('td');
        tdTime.textContent = ((ev.timeStamp - animateMotion.lastRepeat) / 1000).toFixed(2);
        tr.appendChild(tdLap);
        tr.appendChild(tdTime);
        mySplits.appendChild(tr);
    });
    if (endCB) {
        animateMotion.addEventListener('endEvent', endCB);
    }
    const mpath = document.createElementNS('http://www.w3.org/2000/svg', 'mpath');
    mpath.setAttribute('href', `#lane${laneNumber}-path`);
    animateMotion.appendChild(mpath);
    circle.appendChild(animateMotion);
    return circle;
}

document.addEventListener('DOMContentLoaded', function() {
    const svg = document.querySelector('svg#track');
    const defs = document.querySelector('defs#trackdefs');

    const LANE_WIDTH = 1.22
    const SEMI_RADIUS = 36.5
    const SEMI_DIAMETER = SEMI_RADIUS * 2
    const STRAIGHTAWAY_LENGTH = 84.39

    const lanes = 8
    // TODO: These offsets aren't really correct to scale. Need to stare
    // at the world aths specifications and figure it out..
    const vertical_offset = (lanes * (2 * LANE_WIDTH)) / 2
    const horizontal_offset = SEMI_RADIUS + vertical_offset

    // Generate SVG path data for track.
    //
    // SEE: World Athletics Track and Field Facilities Manual 2019 EDITION
    // https://yqnn.github.io/svg-path-editor/
    let offset = 0
    let exp_offset = 0
    let buf = ''
    for (let i = 0; i < 8; i++) {
        buf = ''
        buf += `M ${horizontal_offset + STRAIGHTAWAY_LENGTH} ${SEMI_DIAMETER + vertical_offset + offset}`
        radius = SEMI_RADIUS - offset
        buf += `a ${radius} ${radius} 0 000 -${SEMI_DIAMETER + exp_offset}`
        buf += `l -${STRAIGHTAWAY_LENGTH} 0`
        buf += `a ${radius} ${radius} 0 000 ${SEMI_DIAMETER + exp_offset}`
        buf += `l ${STRAIGHTAWAY_LENGTH} 0`
        buf += `\n`
        defs.appendChild(createLaneDef(i + 1, buf));
        createLane(i + 1).map(svg.appendChild.bind(svg));
        offset += LANE_WIDTH
        exp_offset += LANE_WIDTH * 2
    }

    const a = animateLane(6, 2.5, 3, null, null, 'white');
    svg.appendChild(a);

    const b = animateLane(7, 2, 4, null, null, 'yellow');
    svg.appendChild(b);

    const c = animateLane(1, 1, 64, null, null, 'limegreen');
    svg.appendChild(c);

    const d = animateLane(8, 1, 64, null, null, 'black');
    svg.appendChild(d);

    const e = animateLane(1, 1, 10, null, null, 'blue');
    svg.appendChild(e);

});

