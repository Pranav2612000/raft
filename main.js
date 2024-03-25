import "./style.css";

import Network from "./src/Network";
import { CANVAS_HEIGHT, CANVAS_WIDTH } from "./src/canvas";

document.querySelector("#app").innerHTML = `
  <div class="main">
    <h1>Raft</h1>
    <div id='board' style="height: ${CANVAS_HEIGHT}px; width: ${CANVAS_WIDTH}px;">
      <canvas id='network'
        width=${CANVAS_WIDTH}
        height=${CANVAS_HEIGHT}
        style="width: ${CANVAS_WIDTH}px; height:${CANVAS_HEIGHT}px;box-sizing:border-box"
      ></canvas>
      <canvas id='nodes' width=${CANVAS_WIDTH} height=${CANVAS_HEIGHT} /></canvas>
    </div>
    <button id="resetLeader">Reset Leader</button>
    <button id="addNode">Add Node</button>
    <button id="addData">Send Data</button>
  </div>
`;

const NUM_NODES = 5; // Default number of nodes at the start

console.log("Initializing network...");
const network = new Network(NUM_NODES);
// network.setLeader(0);

document.getElementById("resetLeader").addEventListener("click", () => {
  console.log("RESET LEADER TO FOLLOWER");
  network.resetLeader();
});

document.getElementById("addNode").addEventListener("click", () => {
  network.addNode();
});

let currentMsg = 1;
document.getElementById("addData").addEventListener("click", () => {
  if (!network.leader) {
    console.log('NO LEADER DEFINED');
    return;
  }

  network.nodes[network.leader - 1].receiveData(currentMsg++);
});
