import Network from "./src/Network";

console.log('Initializing network...');
const network = new Network(5);
network.setLeader(0);

document.querySelector('#app').innerHTML = `
  <div>
    <h1>Raft</h1>
    <p>Number of nodes in the network: ${network.numOfNodes}</p>
  </div>
`