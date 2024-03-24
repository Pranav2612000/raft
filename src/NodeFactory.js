import Node from "./Node";

class NodeFactory {
  constructor(minElectionTimeout, maxElectionTimeout, heartbeat, broadcastFn) {
    this.minElectionTimeout = minElectionTimeout;
    this.maxElectionTimeout = maxElectionTimeout;
    this.heartbeat = heartbeat;
    this.broadcastFn = broadcastFn;
  }

  createNode(name, numOfNodes) {
    return new Node(
      name,
      numOfNodes,
      this.minElectionTimeout,
      this.maxElectionTimeout,
      this.heartbeat,
      this.broadcastFn
    );
  }
}
export default NodeFactory;
