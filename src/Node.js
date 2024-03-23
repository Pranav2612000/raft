class Node {

  constructor(name, minElectionTimeout, maxElectionTimeout, state = NODE_STATE.FOLLOWER) {
    this.name = name;
    this.minElectionTimeout = minElectionTimeout;
    this.maxElectionTimeout = maxElectionTimeout;
    this.state = state
  }
}

export default Node;
