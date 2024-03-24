export const CANVAS_HEIGHT = 375;
export const CANVAS_WIDTH = 375;
const NETWORK_RADIUS = 150; // Radius of the circle around which the nodes are placed
const NODE_FILL_COLOR = '#e3dada';

function drawCircle(context, centerX, centerY, radius, fillStyle) {
    context.beginPath();
    context.arc(centerX, centerY, radius, 0, 2 * Math.PI, false);
    if (fillStyle) {
        context.fillStyle = NODE_FILL_COLOR;
        context.fill();
    }
    context.lineWidth = 2;
    context.strokeStyle = 'gray';
    context.stroke();
}

function distanceAndAngleBetweenTwoPoints(x1, y1, x2, y2) {
    var x = x2 - x1,
      y = y2 - y1;
  
    return {
      // x^2 + y^2 = r^2
      distance: Math.sqrt(x * x + y * y),
  
      // convert from radians to degrees
      angle: Math.atan2(y, x) * 180 / Math.PI
    }
  }
  
function createVector(magnitude, angle) {
    var angleRadians = (angle * Math.PI) / 180;

    const magnitudeX = magnitude * Math.cos(angleRadians);
    const magnitudeY = magnitude * Math.sin(angleRadians);

    return { x: magnitudeX, y: magnitudeY };
}

export function getNodePositions(numOfNodes) {
    const nodePositions = [];
    for (let i = 0; i < numOfNodes; i++) {
        const angle = ( i / (numOfNodes/2) ) * Math.PI;
        const x = (NETWORK_RADIUS * Math.cos(angle)) + (NETWORK_RADIUS * 2 + 50) / 2;
        const y = (NETWORK_RADIUS * Math.sin(angle)) + (NETWORK_RADIUS * 2 + 50) / 2;

        nodePositions.push({ x, y });
    }

    return nodePositions;
}

export function drawNodes(context, nodePositions) {
    for (let {x, y} of nodePositions) {
        drawCircle(context, x, y, 15, NODE_FILL_COLOR);
    }
}

export function showDataTransfer(context, startCoords, endCoords, duration, nodePositions) {
    
    let lastFrameTimestamp = 0;
    let x = startCoords.x;
    let y = startCoords.y;

    function animationFrame(milliseconds) {
        // clear previous ui
        context.clearRect(x-15, y-15, 30, 30); // TODO: Come up with better values

        // update particle location
        const elapsed = lastFrameTimestamp ? (milliseconds - lastFrameTimestamp) : 0;
        const durationSeconds = duration / 1000;
        const elapsedSeconds = elapsed / 1000;

        const data = distanceAndAngleBetweenTwoPoints(startCoords.x, startCoords.y, endCoords.x, endCoords.y);
        const velocity = data.distance / durationSeconds; // We want the particle to move from A to B in 1.5 seconds
        const vector = createVector(velocity, data.angle);

        x += (vector.x * elapsedSeconds);
        y += (vector.y * elapsedSeconds);
        lastFrameTimestamp = milliseconds;

        // render particle with newer location
        drawCircle(context, x, y, 10);
        drawNodes(context, nodePositions);

        // Exit if we've reached the end
        const newerData = distanceAndAngleBetweenTwoPoints(x, y, endCoords.x, endCoords.y);
        if (Math.abs(Math.floor(data.angle) - Math.floor(newerData.angle)) > 2) {
            return;
        }

        // Otherwise display the next animation
        window.requestAnimationFrame(animationFrame);
    }

    window.requestAnimationFrame(animationFrame);
}

