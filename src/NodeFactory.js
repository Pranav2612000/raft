import Node from './Node';

class NodeFactory {
  constructor(minElectionTimeout, maxElectionTimeout, heartbeat, broadcastFn) {
    this.minElectionTimeout = minElectionTimeout;
    this.maxElectionTimeout = maxElectionTimeout;
    this.heartbeat = heartbeat;
    this.broadcastFn = broadcastFn;
  }

  createNode(name) {
    return new Node(
      name,
      this.minElectionTimeout,
      this.maxElectionTimeout,
      this.heartbeat,
      this.broadcastFn,
    );
  }
}
export default NodeFactory;
