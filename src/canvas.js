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

export function drawNodes(context, numOfNodes, networkRadius) {
    for (let i = 0; i < numOfNodes; i++) {
        const angle = ( i / (numOfNodes/2) ) * Math.PI;
        const x = (networkRadius * Math.cos(angle)) + (networkRadius * 2 + 50) / 2;
        const y = (networkRadius * Math.sin(angle)) + (networkRadius * 2 + 50) / 2;

        drawCircle(context, x, y, 15, NODE_FILL_COLOR);
    }
}