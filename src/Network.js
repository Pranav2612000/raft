import NodeFactory from './NodeFactory';
import { drawNodes } from "./canvas";


class Network {
  static HEARTBEAT = 100;
  static MAX_ELECTION_TIMEOUT = 300;
  static MIN_ELECTION_TIMEOUT = 150;

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
      this.broadcastFn,
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
    
    this.canvas = document.getElementById('network');
    this.renderCanvas();
  }

  renderCanvas() {
    const context = this.canvas.getContext('2d');

    drawNodes(context, this.nodes.length);
  }

  setLeader(index) {
    if (this.leader) {
      this.nodes[this.leader].setFollower();
    }
    this.leader = index;
    this.nodes[index].setLeader();
  }

  broadcastFn = (msg, receiverIndex) => {
    if (receiverIndex === -1) {
      this.senderBcs.forEach((bc) => {
        bc.postMessage(msg);
      });
    } else {
      this.senderBcs[receiverIndex].postMessage(msg);
    }
  }
}

export default Network;
