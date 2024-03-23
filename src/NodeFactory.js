import Node from './Node';

class NodeFactory {
  constructor(minElectionTimeout, maxElectionTimeout) {
    this.minElectionTimeout = minElectionTimeout;
    this.maxElectionTimeout = maxElectionTimeout;
  }

  createNode(name) {
    return new Node(name, this.minElectionTimeout,this.maxElectionTimeout);
  }
}
export default NodeFactory;
