import { Action } from 'shared/ReactTypes';
import { Update } from './fiberFlags';

// 定义 Update 数据结构
export interface Update<State> {
    action: Action<State>;
}

// 定义 UpdateQueue 数据结构
export interface UpdateQueue<State> {
    shared: {
        pending: Update<State> | null;
    };
}

// 创建 Update 实例的方法
export const creatUpdate = <State>(action: Action<State>): Update<State> => {
    return {
        action
    };
};

// 创建 UpdateQueue 实例的方法
export const creatUpdateQueue = <State>(): UpdateQueue<State> => {
    return {
        shared: {
            pending: null
        }
    };
};

// 将 Update 添加到 UpdateQueue 中的方法
export const enqueueUpdate = <State>(
    updateQueue: UpdateQueue<State>,
    update: Update<State>
) => {
    updateQueue.shared.pending = update;
};

// 从 UpdateQueue 中消费 Update 的方法
export const processUpdateQueue = <State>(
    baseState: State,
    pendingUpdate: Update<State> | null
): { memorizedState: State } => {
    const result: ReturnType<typeof processUpdateQueue<State>> = {
        memorizedState: baseState
    };
    if (pendingUpdate !== null) {
        const action = pendingUpdate.action;
        if (action instanceof Function) {
            // 若 action 是回调函数：(baseState = 1, update = (i) => i * 5) => memorizedState = 5
            // 用于 useState 的函数式更新：setState(prev => prev * 5)
            result.memorizedState = action(baseState);
        } else {
            // 若 action 是状态值或 ReactElement
            // 用于 useState 的直接更新：setState(2) => memorizedState = 2
            // 或根节点渲染：render(<App />) => memorizedState = <App />
            result.memorizedState = action;
        }
    }
    return result;
};
