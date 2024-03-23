import NodeFactory from './NodeFactory';

class Network {
  constructor(numOfNodes) {
    this.numOfNodes = numOfNodes;

    let i = 1;
    this.nodes = [];
    const nodeFactory = new NodeFactory(300);

    while (i <= numOfNodes) {
      this.nodes.push(nodeFactory.createNode(i));
      i++;
    }
  }
}

export default Network;
