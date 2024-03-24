import "./style.css";

import Network from "./src/Network";
import { CANVAS_HEIGHT, CANVAS_WIDTH } from "./src/canvas";

document.querySelector("#app").innerHTML = `
  <div class="main">
    <h1>Raft</h1>
    <canvas id='network' width=${CANVAS_WIDTH} height=${CANVAS_HEIGHT}>
    </canvas>
    <button id="resetLeader">Reset Leader</button>
  </div>
`;

const NUM_NODES = 5; // Default number of nodes at the start

console.log("Initializing network...");
const network = new Network(NUM_NODES);
network.setLeader(0);

document.getElementById("resetLeader").addEventListener("click", () => {
  console.log("REST LEADER TO FOLLOWER");
  network.resetLeader();
});
