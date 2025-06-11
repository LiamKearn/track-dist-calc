"use strict";
/*
PlentyOfLanes
---
A tool to calculate the best lane for a given distance on a track with multiple lanes.
Lane one is taken? No worries there is plenty of lanes in the sea (wait no, track)!*
*/
// =============================================================================
// BOILERPLATE
// =============================================================================
function assert(condition, message) {
    if (!condition) {
        throw new Error(message || 'Assertion failed');
    }
}
function unreachable() {
    throw new Error('Expected unreachable');
}
function nearestNth(value, divisor) {
    return Math.round(value * divisor) / divisor;
}
var RoutePlan;
(function (RoutePlan) {
    // -> Start at the start of the lane, lap at the start of the lane.
    RoutePlan[RoutePlan["FullLane"] = 0] = "FullLane";
    // -> Start at the lead in point, lap at the start of the lane.
    RoutePlan[RoutePlan["LeadIn"] = 1] = "LeadIn";
    // -> Start at the start of the lane, lap at the lead in point.
    RoutePlan[RoutePlan["LeadOut"] = 2] = "LeadOut";
})(RoutePlan || (RoutePlan = {}));
;
function isOptimized(plan) {
    return 'route' in plan;
}
var DistanceUnit;
(function (DistanceUnit) {
    DistanceUnit["Meters"] = "m";
    DistanceUnit["Kilometers"] = "km";
    DistanceUnit["Miles"] = "mi";
})(DistanceUnit || (DistanceUnit = {}));
const unitMap = {
    [DistanceUnit.Meters]: DistanceUnit.Meters,
    [DistanceUnit.Kilometers]: DistanceUnit.Kilometers,
    [DistanceUnit.Miles]: DistanceUnit.Miles
};
const unitPluralSuffixMap = {
    [DistanceUnit.Meters]: 'eters',
    [DistanceUnit.Kilometers]: 's',
    [DistanceUnit.Miles]: 'les'
};
// =============================================================================
// STATIC DATA
// =============================================================================
const METERS_PER_KILOMETER = 1000;
const METERS_PER_MILE = 1609.34;
const lanes = [
    { number: 1, length: 400.000, radius: 36.80, },
    { number: 2, length: 407.037, radius: 37.92, },
    { number: 3, length: 414.703, radius: 39.14, },
    { number: 4, length: 422.368, radius: 40.36, },
    { number: 5, length: 430.034, radius: 41.58, },
    { number: 6, length: 437.699, radius: 42.80, },
    { number: 7, length: 445.365, radius: 44.02, },
    { number: 8, length: 453.030, radius: 45.24, },
];
// Initialise the distance table
for (const lane of lanes) {
    const row = document.createElement('tr');
    const laneCell = document.createElement('td');
    laneCell.textContent = String(lanes.indexOf(lane) + 1);
    const distanceCell = document.createElement('td');
    distanceCell.textContent = String(lane.length);
    row.appendChild(laneCell);
    row.appendChild(distanceCell);
    // Placeholders
    row.appendChild(document.createElement('td'));
    row.appendChild(document.createElement('td'));
    row.appendChild(document.createElement('td'));
    row.appendChild(document.createElement('td'));
    outputbody.appendChild(row);
}
function normalizeToDistanceUnit(destinationUnit, srcDistance) {
    if (srcDistance.unit === destinationUnit) {
        return srcDistance;
    }
    const sourceValue = srcDistance.value;
    switch (srcDistance.unit) {
        case DistanceUnit.Meters:
            if (destinationUnit === DistanceUnit.Kilometers) {
                return { value: sourceValue / METERS_PER_KILOMETER, unit: destinationUnit };
            }
            if (destinationUnit === DistanceUnit.Miles) {
                return { value: sourceValue / METERS_PER_MILE, unit: destinationUnit };
            }
            unreachable();
        case DistanceUnit.Kilometers:
            if (destinationUnit === DistanceUnit.Meters) {
                return { value: sourceValue * METERS_PER_KILOMETER, unit: destinationUnit };
            }
            if (destinationUnit === DistanceUnit.Miles) {
                return { value: sourceValue / METERS_PER_MILE, unit: destinationUnit };
            }
            unreachable();
        case DistanceUnit.Miles:
            if (destinationUnit === DistanceUnit.Meters) {
                return { value: sourceValue * METERS_PER_MILE, unit: destinationUnit };
            }
            if (destinationUnit === DistanceUnit.Kilometers) {
                return { value: sourceValue * METERS_PER_KILOMETER, unit: destinationUnit };
            }
            unreachable();
    }
}
const renderAndCalculateBestLane = () => {
    for (const row of outputbody.rows) {
        row.style.backgroundColor = '';
    }
    const dist = parseFloat(distance.value);
    if (isNaN(dist) || dist <= 0) {
        return;
    }
    // TODO: Validate the unit value
    const unitType = unitMap[unit.value];
    if (!unitType) {
        alert('Please select a valid unit.');
        return;
    }
    const inputDistance = normalizeToDistanceUnit(DistanceUnit.Meters, { value: dist, unit: unitType });
    // TODO: Handle this case:
    if (inputDistance.value < 400) {
        return;
    }
    const inputSplit = Number(split.value);
    if (isNaN(inputSplit) || (inputSplit !== 1 && inputSplit !== 2 && inputSplit !== 4)) {
        alert('Please select a valid split.');
        return;
    }
    const tracksplit = inputSplit;
    let bestDeltaIdx = -1;
    let previousDelta = Infinity;
    for (const [idx, lane] of lanes.entries()) {
        const row = outputbody.rows[idx];
        const distanceCell = row.cells[2];
        const ranCell = row.cells[3];
        const deltaCell = row.cells[4];
        const explanationCell = row.cells[5];
        let plan = createLanePlan(lane, inputDistance, tracksplit);
        if (optimize.checked) {
            plan = optimizeLanePlan(plan);
        }
        const calculatedPlan = calculateDistancePlan(plan);
        distanceCell.textContent = `${calculatedPlan.laps.toFixed(2)} laps`;
        if (isOptimized(calculatedPlan)) {
            switch (calculatedPlan.route) {
                case RoutePlan.FullLane:
                    distanceCell.textContent += ' (Full Lane)';
                    break;
                case RoutePlan.LeadIn:
                    distanceCell.textContent += ` (Lead In)`;
                    break;
                case RoutePlan.LeadOut:
                    distanceCell.textContent += ` (Lead Out)`;
                    break;
                default:
                    unreachable();
            }
        }
        const summary = document.createElement('summary');
        summary.textContent = 'Explain how to run';
        const paragraph = document.createElement('p');
        paragraph.textContent = explainPlan(calculatedPlan);
        const details = document.createElement('details');
        details.appendChild(summary);
        details.appendChild(paragraph);
        if (explanationCell.firstChild) {
            explanationCell.replaceChild(details, explanationCell.firstChild || document.createElement('div'));
        }
        else {
            explanationCell.appendChild(details);
        }
        ranCell.textContent = `${calculatedPlan.distanceRan.toFixed(2)}m`;
        deltaCell.textContent = `${calculatedPlan.delta.toFixed(2)}m (${calculatedPlan.deltaPercentage.toFixed(2)}%)`;
        if (Math.abs(calculatedPlan.delta) < Math.abs(previousDelta)) {
            bestDeltaIdx = idx;
            previousDelta = calculatedPlan.delta;
        }
    }
    const bestRow = outputbody.rows[bestDeltaIdx];
    bestRow.style.backgroundColor = 'lightgreen';
};
// Find the nearest split for a given distance and lane.
function findNearestSplit(targetDistance, forLane, trackSplit) {
    const lapsToDistance = targetDistance.value / forLane.length;
    return nearestNth(lapsToDistance, trackSplit);
}
// Create a lane plan fitted to the nearst split for the given distance and lane.
function createLanePlan(lane, distance, trackSplit) {
    return {
        distance,
        lane,
        laps: findNearestSplit(distance, lane, trackSplit),
    };
}
// Find the delta between the total distance of the lane plan and the targetted distance.
function lanePlanDelta(plan) {
    const { distance, lane, laps } = plan;
    const totalDistance = laps * lane.length;
    return totalDistance - distance.value;
}
// Find a route plan that minimizes the delta for a given lane plan.
function optimizeLanePlan(lanePlan) {
    const markedLeadIn = lanePlan.lane.length - 400;
    const delta = lanePlanDelta(lanePlan);
    const deltaLeading = delta - markedLeadIn;
    const deltaTrailing = delta + markedLeadIn;
    assert(lanePlan.lane.number === 1 || deltaLeading !== deltaTrailing, `Delta leading and trailing should not be equal for lane ${lanePlan.lane.number}.`);
    // Take the absolute values of each delta to find the minimum
    const deltaOpts = [delta, deltaLeading, deltaTrailing].map(Math.abs);
    const chosenIndex = deltaOpts.indexOf(Math.min(...deltaOpts));
    assert(chosenIndex in RoutePlan, `Chosen index ${chosenIndex} is not a valid RoutePlan.`);
    let routePlan = chosenIndex;
    return Object.assign(Object.assign({}, lanePlan), { route: routePlan });
}
function calculateDistancePlan(plan) {
    let distanceRan = plan.laps * plan.lane.length;
    let delta = lanePlanDelta(plan);
    if (!isOptimized(plan) || plan.route === RoutePlan.FullLane) {
        return Object.assign(Object.assign({}, plan), { distanceRan,
            delta, deltaPercentage: (delta / plan.distance.value) * 100 });
    }
    const leadInDistance = plan.lane.length - 400;
    switch (plan.route) {
        case RoutePlan.LeadIn: {
            delta -= leadInDistance;
            distanceRan -= leadInDistance;
            break;
        }
        case RoutePlan.LeadOut: {
            delta += leadInDistance;
            distanceRan += leadInDistance;
            break;
        }
        default: unreachable();
    }
    return Object.assign(Object.assign({}, plan), { distanceRan,
        delta, deltaPercentage: (delta / plan.distance.value) * 100 });
}
function explainPlan(plan) {
    let explanation = ``;
    if (!isOptimized(plan) || plan.route === RoutePlan.FullLane) {
        explanation += `Start at the start of lane ${plan.lane.number}, lap each time you reach the start of the lane.`;
    }
    else {
        const leadInDistance = plan.lane.length - 400;
        switch (plan.route) {
            case RoutePlan.LeadIn:
                explanation += `Start at the marked lead in point of lane ${plan.lane.number} (should be ~${leadInDistance.toFixed(0)}m from the start of the lane), count laps at the start of the lane.`;
                break;
            case RoutePlan.LeadOut:
                explanation += `Start at the start of lane ${plan.lane.number}, count your laps at the marked the lead in point (should be ~${leadInDistance.toFixed(0)}m from the start of the lane).`;
                break;
            default:
                unreachable();
        }
    }
    explanation += ' ';
    const baseLaps = Math.floor(plan.laps);
    const fractionalLaps = plan.laps - baseLaps;
    explanation += `Now run ${baseLaps} laps (this should be ~${(plan.lane.length * baseLaps).toFixed(0)}m)`;
    if (fractionalLaps > 0) {
        explanation += ` and then ${fractionalLaps.toFixed(2)} laps (this should be ${plan.lane.length * fractionalLaps}m).`;
    }
    const overUnder = (plan.delta === 0) ? 'exactly' : (plan.delta > 0 ? 'over' : 'under');
    return explanation + `\nYou will have run ${plan.distanceRan.toFixed(2)}m in total, which is ${plan.delta.toFixed(2)}m (${plan.deltaPercentage.toFixed(2)}%) ${overUnder} your target distance of ${plan.distance.value} ${plan.distance.unit}${unitPluralSuffixMap[plan.distance.unit]}.`;
}
distance.addEventListener('input', renderAndCalculateBestLane);
unit.addEventListener('change', renderAndCalculateBestLane);
split.addEventListener('change', renderAndCalculateBestLane);
optimize.addEventListener('change', renderAndCalculateBestLane);
distanceinput.addEventListener('submit', (e) => {
    e.preventDefault();
    renderAndCalculateBestLane();
});
