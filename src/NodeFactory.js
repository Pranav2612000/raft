import Node from './Node';

class NodeFactory {
  constructor(minElectionTimeout, maxElectionTimeout, heartbeat) {
    this.minElectionTimeout = minElectionTimeout;
    this.maxElectionTimeout = maxElectionTimeout;
    this.heartbeat = heartbeat;
  }

  createNode(name) {
    return new Node(
      name,
      this.minElectionTimeout,
      this.maxElectionTimeout,
      this.heartbeat,
    );
  }
}
export default NodeFactory;
