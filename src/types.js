export const NODE_STATE = Object.freeze({ 
    FOLLOWER: 0, 
    LEADER: 1, 
    CANDIATE: 2,
});

export const MESSAGE_TYPE = Object.freeze({
    HEARTBEAT: 0,
    REQUEST_VOTE: 1,
    CAST_VOTE: 2,
});
