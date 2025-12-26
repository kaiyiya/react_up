import {Action} from "shared/ReactTypes";
import {Update} from './fiberFlags';

export interface Update<State> {
    action: Action<State>
}

export interface UpdateQueue<State> {
    shared: {
        pending: Update<State> | null
    }
}

export const createUpdateQueue = <State>(): UpdateQueue<State> => {
    return {
        shared: {
            pending: null
        }
    }
}

export const enqueueUpdate = <State>(
    updateQueue: UpdateQueue<State>,
    update: Update<State>
) => {
    updateQueue.shared.pending = update
}

// 从 UpdateQueue 中消费 Update 的方法
export const processUpdateQueue = <State>(
    baseState: State,
    pendingUpdate: Update<State> | null
): { memoizedState: State } => {
    const result: ReturnType<typeof processUpdateQueue<State>> = {
        memoizedState: baseState
    };
    if (pendingUpdate !== null) {
        const action = pendingUpdate.action;
        if (action instanceof Function) {
            // 若 action 是回调函数：(baseState = 1, update = (i) => 5 * i)) => memoizedState = 5
            result.memoizedState = action(baseState);
        } else {
            // 若 action 是状态值：(baseState = 1, update = 2) => memoizedState = 2
            result.memoizedState = action;
        }
    }
    return result;
};
