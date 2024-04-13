import { MESSAGE_TYPE, NODE_STATE } from "./types";
// import fs from "fs";

class Node {
  // The node chooses a random time between minElectionTimeout and maxElectionTimeout
  // as election timeout.
  constructor(
    nodeId,
    nodes,
    minElectionTimeout,
    maxElectionTimeout,
    heartbeat,
    broadcastFn,
    onElectionTimeoutUpdate,
    state = NODE_STATE.FOLLOWER,
    term = 0
  ) {
    this.nodeId = nodeId;
    this.nodes = nodes || [];
    this.minElectionTimeout = minElectionTimeout;
    this.maxElectionTimeout = maxElectionTimeout;
    this.heartbeat = heartbeat;

    this.state = state;
    this.term = term;

    // A Map object iterates its elements in insertion order
    // A for...of loop returns an array of [key, value] for each iteration.
    // log entry of the form { msg, term }
    this.logs = [];
    this.db = [];

    // Reset electionInterval
    this.onElectionTimeoutUpdate = onElectionTimeoutUpdate;
    this.electionInterval = this.startElectionInterval();

    this.votedFor = null;
    this.votesReceived = new Set();
    this.broadcastFn = broadcastFn || (() => null);

    this.sentLength = new Map();
    this.ackedLength = new Map();

    this.commitLength = 0;
  }

  delete() {
    this.nodeId = undefined;
    this.nodes = [];
    this.minElectionTimeout = undefined;
    this.maxElectionTimeout = undefined;
    this.heartbeat = undefined;

    this.state = NODE_STATE.DELETED;
    this.term = undefined;

    this.logs = [];
    this.db = [];

    clearInterval(this.electionInterval);

    this.votedFor = undefined;
    this.votesReceived = undefined;
    this.broadcastFn = undefined;

    this.sentLength = undefined;
    this.ackedLength = undefined;

    this.commitLength = undefined;
  }

  appendLog(prefixLen, leaderCommit, suffix) {
    console.log({ prefixLen, leaderCommit, suffix });
    if (suffix.length > 0 && this.logs.length > prefixLen) {
      const index = Math.min(this.logs.length, prefixLen + suffix.length) - 1;

      if (this.logs[index].term != suffix[index - prefixLen].term) {
        this.logs = this.logs.slice(0, prefixLen);
      }
    }

    if (prefixLen + suffix.length > this.logs.length) {
      for (let i = this.logs.length - prefixLen; i < suffix.length; i++) {
        this.logs.push(suffix[i]);
      }
    }

    if (leaderCommit > this.commitLength) {
      this.commit(this.commitLength, leaderCommit);
    }
  }

  // Writes to file in range logs[start,end)
  commit(start, end) {
    console.log("committing at node ", this.nodeId);
    const data = this.logs.slice(start, end).map((log) => log.msg);

    this.db = this.db.concat(data);
    this.commitLength = end;

    // Not compatible in browser
    /** 
    fs.appendFile(`./data/${this.nodeId}.dat`, data.join("\n"), (err) => {
      if (err) {
        return console.log(err);
      }
      console.log(
        `[${this.nodeId}]: Persisted in storage in range [${start},${end})`
      );
      this.commitLength = end;
    });
    */
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
        logLength: this.logs.length,
        //last term is taken from the last entry in logs.
        logLastTerm: this.getLastTermFromLog(),
      },
      -1
    );
  }

  getLastTermFromLog() {
    return this.logs.length > 0 ? this.logs[this.logs.length - 1].term : 0;
  }

  createKey(term, index) {
    return [term, index].join("_");
  }

  getTerm(key) {
    return key && key.split("_")[0];
  }

  startHeartbeatBroadcast() {
    // Don't send commit length first time on becomming leader
    // Let the nodes replicate the data first.
    this.broadcastFn(
      this.nodeId,
      {
        type: MESSAGE_TYPE.HEARTBEAT,
        data: this.createHeartbeatData(),
      },
      -1
    );
    this.heartbeatInterval = setInterval(() => {
      this.resetElectionInterval();
      this.broadcastFn(
        this.nodeId,
        {
          type: MESSAGE_TYPE.HEARTBEAT,
          data: this.createHeartbeatData(),
        },
        -1
      );
    }, this.heartbeat);
  }

  setLeader() {
    this.state = NODE_STATE.LEADER;
    this.startHeartbeatBroadcast();

    this.nodes.forEach((nodeId) => {
      if (nodeId == this.nodeId) {
        return;
      }

      this.sentLength.set(nodeId, this.logs.length);
      this.ackedLength.set(nodeId, 0);

      this.replicateLog(nodeId);
    });
  }

  setFollower() {
    this.state = NODE_STATE.FOLLOWER;
    this.heartbeatInterval && clearInterval(this.heartbeatInterval);
  }

  onMessageReceived(event) {
    const msg = event.data;

    switch (msg.type) {
      case MESSAGE_TYPE.HEARTBEAT: {
        this.resetElectionInterval();
        this.handleLogRequest(msg.data[this.nodeId]);
        return;
      }
      case MESSAGE_TYPE.REQUEST_VOTE: {
        this.handleVoteRequest(msg);
        return;
      }
      case MESSAGE_TYPE.CAST_VOTE: {
        this.handleCastedVote(msg);
        return;
      }
      case MESSAGE_TYPE.NEW_NODE: {
        this.nodes.push(msg.nodeId);
        this.ackedLength.set(msg.nodeId, 0);
        if (this.state == NODE_STATE.LEADER) {
          this.replicateLog(msg.nodeId);
        }
        return;
      }
      case MESSAGE_TYPE.DELETE_NODE: {
        const nodeToBeDeleted = msg.nodeId;
        this.nodes = this.nodes.filter((id) => id != nodeToBeDeleted);
        this.ackedLength?.delete(nodeToBeDeleted);
        return;
      }
      case MESSAGE_TYPE.LOG_REQUEST: {
        console.log("LOG_REQUEST", { msg });
        return this.handleLogRequest(msg);
      }

      case MESSAGE_TYPE.LOG_RESPONSE: {
        console.log("LOG_RESPONSE", { msg });
        return this.handleLogResponse(msg);
      }

      default: {
        console.log("Unknown message type received at receiver channel !");
      }
    }
  }

  getQuorum() {
    return Math.ceil((this.nodes.length + 1) / 2);
  }

  handleVoteRequest(msg) {
    // extract fields from message
    const cNodeId = msg.nodeId;
    const cTerm = msg.voteTerm;
    const CLogLength = msg.logLength;
    const cLogLastTerm = msg.logLastTerm;

    if (cTerm > this.term) {
      this.term = cTerm;
      this.setFollower();
      this.votedFor = null;
    }
    const logLastTerm = this.getLastTermFromLog();
    const logOk =
      cLogLastTerm > logLastTerm ||
      (cLogLastTerm === logLastTerm && CLogLength >= this.logs.length);

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
      if (this.votesReceived.size >= this.getQuorum()) {
        // setting the current node as the leader
        this.setLeader();

        /*
        // moved to setLeader
        this.nodes.forEach((nodeId) => {
          if (nodeId == this.nodeId) {
            return;
          }

          this.sentLength.set(nodeId, this.logs.length);
          this.ackedLength.set(nodeId, 0);

          this.replicateLog(nodeId);
        });
        */
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

  createLogRequest(type, followerId) {
    const leaderId = this.nodeId;

    const prefixLen = this.sentLength.get(followerId) || 0;
    const suffix = this.logs.slice(prefixLen);

    let prefixTerm = 0;
    if (prefixLen > 0) {
      prefixTerm = this.logs[prefixLen - 1].term;
    }

    return {
      type: type,
      leaderId: leaderId,
      currentTerm: this.term,
      prefixLen: prefixLen,
      prefixTerm: prefixTerm,
      commitLength: this.commitLength,
      suffix: suffix,
    };
  }

  createHeartbeatData() {
    let msg = {};
    for (const nodeId of this.nodes) {
      msg[nodeId] = this.createLogRequest(MESSAGE_TYPE.HEARTBEAT, nodeId);
    }
    return msg;
  }

  replicateLog(followerId) {
    this.broadcastFn(
      this.nodeId,
      this.createLogRequest(MESSAGE_TYPE.LOG_REQUEST, followerId),
      followerId
    );
  }

  handleLogRequest(msg) {
    const {
      type,
      leaderId,
      currentTerm,
      prefixLen,
      prefixTerm,
      commitLength,
      suffix,
    } = msg;
    if (currentTerm > this.term) {
      this.term = currentTerm;
      this.votedFor = null;
      this.votesReceived = new Set();
      this.resetElectionInterval();
    }

    if (currentTerm == this.term) {
      this.setFollower();
    }

    const logOk =
      this.logs.length >= prefixLen &&
      (prefixLen == 0 || this.logs[prefixLen - 1].term == prefixTerm);

    if (currentTerm == this.term && logOk) {
      this.appendLog(prefixLen, commitLength, suffix);

      const ack = prefixLen + suffix.length;

      if (type === MESSAGE_TYPE.HEARTBEAT) {
        if (this.commitLength < commitLength)
          this.commit(this.commitLength, commitLength);
        return;
      }
      this.broadcastFn(
        this.nodeId,
        {
          type: MESSAGE_TYPE.LOG_RESPONSE,
          nodeId: this.nodeId,
          currentTerm: this.term,
          ack: ack,
          success: true,
        },
        leaderId
      );
    } else {
      this.broadcastFn(
        this.nodeId,
        {
          type: MESSAGE_TYPE.LOG_RESPONSE,
          nodeId: this.nodeId,
          currentTerm: this.term,
          ack: 0,
          success: false,
        },
        leaderId
      );
    }
  }

  handleLogResponse(msg) {
    const { nodeId, currentTerm, ack, success } = msg;

    if (currentTerm == this.term && this.state == NODE_STATE.LEADER) {
      if (success == true && ack >= this.ackedLength.get(nodeId)) {
        this.sentLength.set(nodeId, ack);
        this.ackedLength.set(nodeId, ack);
        this.leaderCommit();
      } else if (this.sentLength[nodeId] > 0) {
        this.sentLength.set(nodeId, this.sentLength.get(nodeId) - 1);
        this.replicateLog(nodeId);
      }
    } else if (currentTerm > this.term) {
      this.term = currentTerm;
      this.setFollower();
      this.votedFor = null;
      this.votesReceived = new Set();
      this.resetElectionInterval();
    }
  }

  leaderCommit() {
    const minAcks = this.getQuorum();
    const ready = this.logs.map((log, index) => {
      // if (index < this.commitLength) return -1;
      const acks = this.nodes.filter((node) => {
        return this.ackedLength.get(node) >= index + 1;
      }).length;

      if (acks >= minAcks) {
        return index + 1;
      }
      return -1;
    });

    const maxReady = Math.max(...ready);
    if (
      ready.length != 0 &&
      maxReady > this.commitLength &&
      this.logs[maxReady - 1].term == this.term
    ) {
      this.commit(this.commitLength, maxReady);
    }
  }

  receiveData(data) {
    if (this.state != NODE_STATE.LEADER) {
      return;
    }

    this.logs.push({ term: this.term, msg: data });
    this.ackedLength.set(this.nodeId, this.logs.length);

    // Replicate logs for all nodes
    this.nodes.forEach((nodeId) => {
      if (nodeId == this.nodeId) {
        return;
      }

      this.replicateLog(nodeId);
    });
  }
}

export default Node;
