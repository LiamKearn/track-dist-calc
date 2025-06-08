const lanes = [
    { length: 400.000, radius: 36.80, semicirclelength: 115.611, delta200: 0.000, delta400: 0.000, delta800: 0.000, },
    { length: 407.037, radius: 37.92, semicirclelength: 119.129, delta200: 3.519, delta400: 7.037, delta800: 3.526, },
    { length: 414.703, radius: 39.14, semicirclelength: 122.962, delta200: 7.351, delta400: 14.703, delta800: 7.384, },
    { length: 422.368, radius: 40.36, semicirclelength: 126.795, delta200: 11.184, delta400: 22.368, delta800: 11.259, },
    { length: 430.034, radius: 41.58, semicirclelength: 130.627, delta200: 15.017, delta400: 30.034, delta800: 15.151, },
    { length: 437.699, radius: 42.80, semicirclelength: 134.460, delta200: 18.850, delta400: 37.699, delta800: 19.060, },
    { length: 445.365, radius: 44.02, semicirclelength: 138.293, delta200: 22.682, delta400: 45.365, delta800: 22.987, },
    { length: 453.030, radius: 45.24, semicirclelength: 142.126, delta200: 26.515, delta400: 53.030, delta800: 26.930, },
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
    outputbody.appendChild(row);
}
calculate.addEventListener('click', () => {
    for (const row of outputbody.rows) {
        row.style.backgroundColor = '';
    }
    const dist = parseFloat(distance.value);
    if (isNaN(dist) || dist <= 0) {
        alert('Please enter a valid positive number for distance.');
        return;
    }
    let convertedDistance;
    switch (unit.value) {
        case 'm':
            convertedDistance = dist;
            break;
        case 'km':
            convertedDistance = dist * 1000;
            break;
        case 'mi':
            convertedDistance = dist * 1609.34;
            break;
        default:
            alert('Please select a valid unit.');
            return;
    }
    // Output the converted distance
    console.log(`Converted distance: ${convertedDistance} meters`);
    let bestDeltaIdx = -1;
    let previousDelta = Infinity;
    const tracksplit = Number(split.value);
    for (const [idx, lane] of lanes.entries()) {
        const laps = convertedDistance / lane.length;
        const row = outputbody.rows[idx];
        const distanceCell = row.cells[2];
        const ranCell = row.cells[3];
        const deltaCell = row.cells[4];
        const nearestSplit = Math.round(laps * tracksplit) / tracksplit;
        distanceCell.textContent = `${nearestSplit.toFixed(2)} laps`;
        ranCell.textContent = `${(nearestSplit * lane.length).toFixed(2)} m`;
        const delta = (nearestSplit * lane.length) - convertedDistance;
        if (Math.abs(delta) < Math.abs(previousDelta)) {
            bestDeltaIdx = idx;
            previousDelta = delta;
        }
        deltaCell.textContent = `${delta.toFixed(2)} m (${(delta / lane.length * 100).toFixed(2)}%)`;
    }
    const bestRow = outputbody.rows[bestDeltaIdx];
    bestRow.style.backgroundColor = 'lightgreen';
});
