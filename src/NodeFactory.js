import Node from "./Node";

class NodeFactory {
  constructor(
    minElectionTimeout,
    maxElectionTimeout,
    heartbeat,
    broadcastFn,
    onElectionTimeoutUpdate,
  ) {
    this.minElectionTimeout = minElectionTimeout;
    this.maxElectionTimeout = maxElectionTimeout;
    this.heartbeat = heartbeat;
    this.broadcastFn = broadcastFn;
    this.onElectionTimeoutUpdate = onElectionTimeoutUpdate;
  }

  createNode(name, numOfNodes) {
    return new Node(
      name,
      numOfNodes,
      this.minElectionTimeout,
      this.maxElectionTimeout,
      this.heartbeat,
      this.broadcastFn,
      this.onElectionTimeoutUpdate,
    );
  }
}
export default NodeFactory;
