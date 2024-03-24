import NodeFactory from "./NodeFactory";
import { drawNodes, getNodePositions, showDataTransfer } from "./canvas";

class Network {
  static HEARTBEAT = 2000;
  static MAX_ELECTION_TIMEOUT = 60000;
  static MIN_ELECTION_TIMEOUT = 30000;
  static NETWORK_DELAY = 2000; // in milliseconds

  constructor(numOfNodes) {
    this.numOfNodes = numOfNodes;

    let i = 1;
    this.nodes = [];
    this.senderBcs = [];
    this.receiverBcs = [];
    const nodeFactory = new NodeFactory(
      Network.MIN_ELECTION_TIMEOUT,
      Network.MAX_ELECTION_TIMEOUT,
      Network.HEARTBEAT,
      this.broadcastFn
    );

    while (i <= numOfNodes) {
      const node = nodeFactory.createNode(i);
      const senderBc = new BroadcastChannel(i);
      const receiverBc = new BroadcastChannel(i);
      this.nodes.push(node);
      this.senderBcs.push(senderBc);
      receiverBc.onmessage = (event) => {
        node.onMessageReceived(event);
      };
      i++;
    }

    // index of the current leader.
    // We start the network with no leader so we set this to undefined
    this.leader = undefined;

    this.canvas = document.getElementById("network");
    this.nodePositions = getNodePositions(this.nodes.length);
    this.renderCanvas();
  }

  renderCanvas() {
    console.log({ positions: this.nodePositions });
    const context = this.canvas.getContext("2d");

    drawNodes(context, this.nodePositions);
  }

  setLeader(index) {
    if (this.leader) {
      this.nodes[this.leader].setFollower();
    }
    this.leader = index;
    this.nodes[index].setLeader();
  }

  broadcastFn = (senderIndex, msg, receiverIndex) => {
    if (receiverIndex === -1) {
      this.senderBcs.forEach((bc, index) => {
        showDataTransfer(
          this.canvas.getContext("2d"),
          this.nodePositions[senderIndex - 1],
          this.nodePositions[index - 1],
          Network.NETWORK_DELAY,
          this.nodePositions
        );
        bc.postMessage(msg);
      });
    } else {
      showDataTransfer(
        this.canvas.getContext("2d"),
        this.nodePositions[senderIndex - 1],
        this.nodePositions[receiverIndex - 1],
        Network.NETWORK_DELAY,
        this.nodePositions
      );
      this.senderBcs[receiverIndex - 1].postMessage(msg);
    }
  };
}

export default Network;
