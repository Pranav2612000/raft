import {NODE_STATE} from "./types"

class Node {

  // The node chooses a random time between minElectionTimeout and maxElectionTimeout 
  // as election timeout.
  constructor(name, minElectionTimeout, maxElectionTimeout, state = NODE_STATE.FOLLOWER, term = 1) {
    this.name = name;
    this.minElectionTimeout = minElectionTimeout;
    this.maxElectionTimeout = maxElectionTimeout;

    this.state = state;
    this.term = term;

    // A Map object iterates its elements in insertion order — a for...of loop returns an array of [key, value] for each iteration.
    this.logs = new Map()
    this.db = []
    
    // Reset electionInterval
    this.electionInterval = this.startInterval() 
  }

  appendLog(term,index,content){
    this.logs.set(this.createKey(term,index),content)
  }

  startInterval(){
    this.electionTimeout = this.getNewElectionTimeout()
    return setInterval(() => this.timedOut(),this.electionTimeout)
  }

  resetInterval(){
    clearInterval(this.electionInterval)
    return this.startInterval()
  }

  getNewElectionTimeout() {
    return Math.floor((Math.random() * (this.maxElectionTimeout - this.minElectionTimeout)) + this.minElectionTimeout)
  }

  timedOut(){
    console.log("Election timout complete at node: ", this.name, "after timeout ", this.electionTimeout);
    // If leader is present in the network, do nothing & return.

    // If leader is not present, then change state to candidate and send out requestVotes request to all other nodes.

  }

  createKey(term, index){
    return [term,index].join("_")
  }
}

export default Node;
