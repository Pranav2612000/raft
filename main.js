import "./style.css";

import { drawNodes } from "./src/canvas";
import Network from "./src/Network";

const CANVAS_HEIGHT = 375;
const CANVAS_WIDTH = 375;
const NETWORK_RADIUS = 150; // Radius of the circle around which the nodes are placed

const NUM_NODES = 5; // Default number of nodes at the start

console.log('Initializing network...');
const network = new Network(NUM_NODES);
// network.setLeader(0);

document.querySelector('#app').innerHTML = `
  <div>
    <h1>Raft</h1>
    <p>Number of nodes in the network: ${network.numOfNodes}</p>
    <canvas id='network' width=${CANVAS_WIDTH} height=${CANVAS_HEIGHT}>
    </canvas>
  </div>
`

const canvas = document.getElementById('network');
const context = canvas.getContext('2d');

drawNodes(context, NUM_NODES, NETWORK_RADIUS);
