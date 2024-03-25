import NodeFactory from "./NodeFactory";
import { clearNodes,drawNode, drawNodes, getNodePositions, showDataTransfer, updateNodePositions } from "./canvas";
import { MESSAGE_TYPE} from "./types";

class Network {
  static HEARTBEAT = 4000;
  static MAX_ELECTION_TIMEOUT = 9000;
  static MIN_ELECTION_TIMEOUT = 6000;
  static NETWORK_DELAY = 1000; // in milliseconds

  constructor(numOfNodes) {
    this.numOfNodes = numOfNodes;

    let i = 1;
    this.nodes = [];
    this.senderBcs = [];
    this.receiverBcs = [];
    this.nextNodeId = numOfNodes + 1;
    this.nodeFactory = new NodeFactory(
      Network.MIN_ELECTION_TIMEOUT,
      Network.MAX_ELECTION_TIMEOUT,
      Network.HEARTBEAT,
      this.broadcastFn,
      this.onElectionTimeoutUpdate,
    );
    
    this.nodeIds = Array.from({ length: numOfNodes }, (_, i) => i + 1);
    while (i <= numOfNodes) {
        this.nodes.push(this.createNode(i));
      i++;
    }

    // index of the current leader.
    // We start the network with no leader so we set this to undefined
    this.leader = undefined;

    this.canvas = { network: document.getElementById("network"), nodes: document.getElementById("nodes") };
    this.nodePositions = getNodePositions(this.nodes.length);
    this.renderCanvas();
  }

  renderCanvas() {
    const context = this.canvas.nodes.getContext("2d");
    drawNodes(this.canvas, context, this.nodePositions, this.nodes);
  }

  setLeader(index) {
    if (this.leader) {
      this.nodes[this.leader].setFollower();
    }
    this.leader = index;
    this.nodes[index].setLeader();
  }

  resetLeader() {
    this.nodes.forEach((node) => {
      node.setFollower();
      return;
    });
  }

  createNode(nodeId){
    const node = this.nodeFactory.createNode(nodeId, this.nodeIds); 
    const senderBc = new BroadcastChannel(nodeId);
    const receiverBc = new BroadcastChannel(nodeId);
    this.senderBcs.push(senderBc);
    receiverBc.onmessage = (event) => {
      node.onMessageReceived(event);
    };
    return node
  }

  addNode() {
    const context = this.canvas?.nodes?.getContext("2d");
    const nodeId = this.nextNodeId++;

    this.nodeIds.push(nodeId);
    this.nodes.push(this.createNode(nodeId));

    // Updates node positions in place so that the rendering function
    // can directly start using the newer locations
    updateNodePositions(this.nodePositions, this.nodes.length);
    drawNode(
      context,
      this.nodePositions[this.nodes.length - 1],
      this.nodes[this.nodes.length - 1]
    );

    this.broadcastFn(-1, { type: MESSAGE_TYPE.NEW_NODE, nodeId }, -1);
  }

  broadcastFn = async (senderIndex, msg, receiverIndex) => {
    if (senderIndex === -1) {  
      this.senderBcs.forEach(async (bc) => {
        bc.postMessage(msg);
      });
        return;
    }
    if (receiverIndex === -1) {
      this.senderBcs.forEach(async (bc, index) => {
        // don't send messages to self
        if (senderIndex - 1 === index) {
          return;
        }

        if (msg.type === MESSAGE_TYPE.HEARTBEAT) {
          this.leader = senderIndex;
        }

        await showDataTransfer(
          this.canvas,
          this.nodePositions[senderIndex - 1],
          this.nodePositions[index],
          Network.NETWORK_DELAY,
          this.nodePositions,
          msg.type
        );
        bc.postMessage(msg);
      });
    } else {
      await showDataTransfer(
        this.canvas,
        this.nodePositions[senderIndex - 1],
        this.nodePositions[receiverIndex - 1],
        Network.NETWORK_DELAY,
        this.nodePositions,
        msg.type
      );
      this.senderBcs[receiverIndex - 1].postMessage(msg);
    }
  };

  onElectionTimeoutUpdate = (nodeIndex) => {
    const context = this.canvas?.nodes?.getContext("2d");
//first time when the ndoe is created, the position is not available yet !
      if(nodeIndex > this.nodes.length) {
        return;
    }
    if (!context) {
      return;
    }

    drawNode(context, this.nodePositions[nodeIndex - 1], this.nodes[nodeIndex - 1]);
  }
}

export default Network;
