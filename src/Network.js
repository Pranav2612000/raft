import NodeFactory from './NodeFactory';

class Network {
  static HEARTBEAT = 100;
  static MAX_ELECTION_TIMEOUT = 300;
  static MIN_ELECTION_TIMEOUT = 150;

  constructor(numOfNodes) {
    this.numOfNodes = numOfNodes;

    let i = 1;
    this.nodes = [];
    const nodeFactory = new NodeFactory(
      Network.MIN_ELECTION_TIMEOUT,
      Network.MAX_ELECTION_TIMEOUT,
      Network.HEARTBEAT
    );

    while (i <= numOfNodes) {
      this.nodes.push(nodeFactory.createNode(i));
      i++;
    }
  }
}

export default Network;
