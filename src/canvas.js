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

export function drawNodes(context, numOfNodes) {
    for (let i = 0; i < numOfNodes; i++) {
        const angle = ( i / (numOfNodes/2) ) * Math.PI;
        const x = (NETWORK_RADIUS * Math.cos(angle)) + (NETWORK_RADIUS * 2 + 50) / 2;
        const y = (NETWORK_RADIUS * Math.sin(angle)) + (NETWORK_RADIUS * 2 + 50) / 2;

        drawCircle(context, x, y, 15, NODE_FILL_COLOR);
    }
}