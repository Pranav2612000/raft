import { MESSAGE_TYPE, NODE_STATE } from "./types";
import { Entry } from "./Entry";

class Node {
  // The node chooses a random time between minElectionTimeout and maxElectionTimeout
  // as election timeout.
  constructor(
    nodeId,
    numOfNodes,
    minElectionTimeout,
    maxElectionTimeout,
    heartbeat,
    broadcastFn,
    onElectionTimeoutUpdate,
    state = NODE_STATE.FOLLOWER,
    term = 0
  ) {
    this.nodeId = nodeId;
    this.numOfNodes = numOfNodes;
    this.minElectionTimeout = minElectionTimeout;
    this.maxElectionTimeout = maxElectionTimeout;
    this.heartbeat = heartbeat;

    this.state = state;
    this.term = term;

    // A Map object iterates its elements in insertion order
    // A for...of loop returns an array of [key, value] for each iteration.
    this.logs = new Map();
    this.db = [];

    // Reset electionInterval
    this.onElectionTimeoutUpdate = onElectionTimeoutUpdate;
    this.electionInterval = this.startElectionInterval();

    this.votedFor = null;
    this.votesReceived = new Set();
    this.broadcastFn = broadcastFn || (() => null);
  }

  appendLog(term, index, content) {
    this.logs.set(this.createKey(term, index), content);
  }

  commit(term, index) {
    key = this.createKey(term, index);
    if ((content = this.logs.get()) != undefined) {
      this.db.push(Entry(content, new Date().getTime()));
      this.logs.delete(key);
    }
  }

  startElectionInterval() {
    this.electionTimeout = this.getNewElectionTimeout();
    this.onElectionTimeoutUpdate(this.nodeId);
    return setInterval(() => this.timedOut(), this.electionTimeout);
  }

  resetElectionInterval() {
    clearInterval(this.electionInterval);
    this.electionInterval = this.startElectionInterval();
  }

  getNewElectionTimeout() {
    return Math.floor(
      Math.random() * (this.maxElectionTimeout - this.minElectionTimeout) +
        this.minElectionTimeout
    );
  }

  timedOut() {
    console.log(
      "Election timout complete at node: ",
      this.nodeId,
      "after timeout ",
      this.electionTimeout
    );
    // If leader is present in the network, do nothing & return.
    if (this.state === NODE_STATE.LEADER) {
      return;
    }

    // Leader might not be present, change state to candidate and send out requestVotes request to all other nodes.
    this.state = NODE_STATE.CANDIATE;

    this.term += 1;
    this.votedFor = this.nodeId;
    this.votesReceived = new Set([this.nodeId]);

    this.broadcastFn(
      this.nodeId,
      {
        type: MESSAGE_TYPE.REQUEST_VOTE,
        nodeId: this.nodeId,
        voteTerm: this.term,
        logLength: this.logs.size,
        //last term is taken from the last entry in logs.
        logLastTerm: this.getLastTermFromLog(),
      },
      -1
    );
  }

  getLastTermFromLog() {
    return this.logs.size > 0
      ? this.getTerm(Array.from(this.logs.keys())[this.logs.size - 1])
      : 0;
  }

  createKey(term, index) {
    return [term, index].join("_");
  }

  getTerm(key) {
    return key && key.split("_")[0];
  }

  startHeartbeatBroadcast() {
    this.broadcastFn(
      this.nodeId,
      {
        type: MESSAGE_TYPE.HEARTBEAT,
      },
      -1
    );
    this.heartbeatInterval = setInterval(() => {
      this.broadcastFn(
        this.nodeId,
        {
          type: MESSAGE_TYPE.HEARTBEAT,
        },
        -1
      );
    }, this.heartbeat);
  }

  setLeader() {
    this.state = NODE_STATE.LEADER;
    this.startHeartbeatBroadcast();
  }

  setFollower() {
    this.state = NODE_STATE.FOLLOWER;
    this.heartbeatInterval && clearInterval(this.heartbeatInterval);
  }

  onMessageReceived(event) {
    const msg = event.data;

    switch (msg.type) {
      case MESSAGE_TYPE.HEARTBEAT: {
        console.log("Heartbeat received from leader at node: ", this.nodeId);
        this.resetElectionInterval();
        return;
      }
      case MESSAGE_TYPE.REQUEST_VOTE: {
        console.log(
          "Vote requested by node: ",
          msg.nodeId,
          " at node ",
          this.nodeId,
          "TERM = ",
          msg.voteTerm,
          { msg }
        );
        this.handleVoteRequest(msg);
        return;
      }
      case MESSAGE_TYPE.CAST_VOTE: {
        console.log(
          "Vote Received from node: ",
          msg.nodeId,
          " by node ",
          this.nodeId,
          "VOTE = ",
          msg.vote,
          { msg }
        );
        this.handleCastedVote(msg);
        return;
      }
      case MESSAGE_TYPE.NEW_NODE: {
        this.numOfNodes += 1;
        return;
      }
      default: {
        console.log("Unknown message type received at receiver channel !");
      }
    }
  }

  handleVoteRequest(msg) {
    // extract fields from message
    const cNodeId = msg.nodeId;
    const cTerm = msg.voteTerm;
    const CLogLength = msg.logLength;
    const cLogLastTerm = msg.logLastTerm;

    // If this node itself is requesting votes, then do nothing and return
    // if (cNodeId == this.nodeId) {
    //   return
    // }

    if (cTerm > this.term) {
      this.term = cTerm;
      this.setFollower();
      this.votedFor = null;
    }
    const logLastTerm = this.getLastTermFromLog();
    const logOk =
      cLogLastTerm > logLastTerm ||
      (cLogLastTerm === logLastTerm && CLogLength >= this.logs.size);

    // Okay to vote for same node twice
    if (
      cTerm === this.term &&
      logOk &&
      (this.votedFor === cNodeId || this.votedFor === null)
    ) {
      this.votedFor = cNodeId;
      this.broadcastFn(
        this.nodeId,
        {
          type: MESSAGE_TYPE.CAST_VOTE,
          nodeId: this.nodeId,
          term: this.term,
          vote: true,
        },
        cNodeId
      );
    } else {
      this.broadcastFn(
        this.nodeId,
        {
          type: MESSAGE_TYPE.CAST_VOTE,
          nodeId: this.nodeId,
          term: this.term,
          vote: false,
        },
        cNodeId
      );
    }
    this.resetElectionInterval();
  }

  handleCastedVote(msg) {
    const voterId = msg.nodeId;
    const voterTerm = msg.term;
    const granted = msg.vote;

    if (
      this.state === NODE_STATE.CANDIATE &&
      voterTerm === this.term &&
      granted
    ) {
      this.votesReceived.add(voterId);
      if (this.votesReceived.size >= Math.ceil((this.numOfNodes + 1) / 2)) {
        this.setLeader();
      }
    } else if (voterTerm > this.term) {
      // There exists a node in the network with higher term number, so be the follower of that node
      this.term = voterTerm;
      this.setFollower();
      this.votedFor = null;
      this.votesReceived = new Set();
    }
    this.resetElectionInterval();
  }
}

export default Node;
