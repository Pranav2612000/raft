import Node from './Node';

class NodeFactory {
  constructor(backoffTime) {
    this.backoffTime = backoffTime;
  }

  createNode(name) {
    return new Node(name, this.backoffTime);
  }
}
