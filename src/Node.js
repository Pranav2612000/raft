import {MESSAGE_TYPE, NODE_STATE} from "./types"
import {Entry} from "./Entry"

class Node {

  // The node chooses a random time between minElectionTimeout and maxElectionTimeout 
  // as election timeout.
  constructor(name, minElectionTimeout, maxElectionTimeout, heartbeat, broadcastFn, state = NODE_STATE.FOLLOWER, term = 1) {
    this.name = name;
    this.minElectionTimeout = minElectionTimeout;
    this.maxElectionTimeout = maxElectionTimeout;
    this.heartbeat = heartbeat;

    this.state = state;
    this.term = term;

    // A Map object iterates its elements in insertion order
    // A for...of loop returns an array of [key, value] for each iteration.
    this.logs = new Map();
    this.db = []
    
    // Reset electionInterval
    this.electionInterval = this.startInterval() 

    this.broadcastFn = broadcastFn || (() => null);
  }

  appendLog(term,index,content){
    this.logs.set(this.createKey(term,index),content)
  }

  commit(term,index){
    key = this.createKey(term,index)
    if((content = this.logs.get()) != undefined){
      this.db.push(Entry(content, (new Date()).getTime()))
      this.logs.delete(key)
    }
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
    // console.log("Election timout complete at node: ", this.name, "after timeout ", this.electionTimeout);
    // If leader is present in the network, do nothing & return.

    // If leader is not present, then change state to candidate and send out requestVotes request to all other nodes.

  }

  createKey(term, index){
    return [term,index].join("_")
  }

  startHeartbeatBroadcast() {
    this.heartbeatInterval = setInterval(() => {
      this.broadcastFn({
        type: MESSAGE_TYPE.HEARTBEAT,
      }, -1)
    }, this.heartbeat);
  }

  setLeader() {
    this.state = NODE_STATE.LEADER
    this.startHeartbeatBroadcast();
  }

  setFollower() {
    this.state = NODE_STATE.FOLLOWER;
    this.heartbeatInterval && clearInterval(this.heartbeatInterval);
  }

  onMessageReceived(event) {
    const msg = event.data;

    if (msg.type === MESSAGE_TYPE.HEARTBEAT) {
      console.log('Heartbeat received from leader', this.name);
    }
  }
}

export default Node;
