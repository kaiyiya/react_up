import {ReactElementType} from 'shared/ReactTypes';
import {FiberNode} from './fiber';
import {UpdateQueue, processUpdateQueue} from './updateQueue';
import {
    FunctionComponent,
    HostComponent,
    HostRoot,
    HostText
} from './workTags';
import {reconcileChildFibers, mountChildFibers} from './childFiber';
import {renderWithHooks} from './fiberHooks';

/**
 * @title: 比较并且返回子FiberNode
 * @param: workInProgress 当前正在处理的FiberNode
 * @return: 返回子FiberNode 或 null，表示没有子节点
 * @description: 根据当前的FiberNode和更新队列，计算出更新后的状态，并返回子FiberNode。
 * 除了Text返回的是null,其它返回的是FiberNode;一共支持几种tag: HostRoot, HostComponent, HostText, FunctionComponent
 * 这里的tag就是节点类型,类型是WorkTag
 * @date: 2026/3/2
 */
export const beginWork = (workInProgress: FiberNode) => {
    switch (workInProgress.tag) {
        case HostRoot:
            return updateHostRoot(workInProgress);
        case HostComponent:
            return updateHostComponent(workInProgress);
        case FunctionComponent:
            return updateFunctionComponent(workInProgress);
        case HostText:
            return updateHostText();
        default:
            if (__DEV__) {
                console.warn('beginWork 未实现的类型', workInProgress.tag);
            }
            break;
    }
};

/**
 * @title: 更新HostRoot
 * @param: workInProgress 当前正在处理的FiberNode
 * @return: 返回子FiberNode 或 null，表示没有子节点
 * @description: 任何触发根节点更新的场景都会调用
 * 1. 获取当前的状态baseState(来自于wip的memorizedState)和待处理的更新队列,清空更新链表(目前只有单节点的链表,实际应该是循环链表)
 * 2. 计算待更新状态的最新值，并更新wip中的节点状态
 * 3. 将计算出的最新状态作为nextChildren,进行子节点的协调工作
 * 4. 返回子节点
 * @date: 2026/3/2
 */
function updateHostRoot(workInProgress: FiberNode) {
    // 根据当前节点和工作中节点的状态进行比较，处理属性等更新逻辑
    const baseState = workInProgress.memorizedState;
    const updateQueue = workInProgress.updateQueue as UpdateQueue<Element>;
    const pending = updateQueue.shared.pending;
    // 清空更新链表
    updateQueue.shared.pending = null;
    // 计算待更新状态的最新值
    const {memorizedState} = processUpdateQueue(baseState, pending);
    workInProgress.memorizedState = memorizedState;

    // 处理子节点的更新逻辑
    const nextChildren = workInProgress.memorizedState;
    reconcileChildren(workInProgress, nextChildren);

    // 返回新的子节点
    return workInProgress.child;
}

/**
 * @title: 更新原生的普通DOM组件,比如<div>
 * @param: workInProgress 当前正在处理的FiberNode
 * @return: 返回子FiberNode 或 null，表示没有子节点
 * @description:
 * 1. 这里和HostRoot的区别在于，HostRoot是根节点，会处理更新逻辑，而HostComponent是普通DOM组件，不会处理更新逻辑
 *  也就是说,updateHostRoot决定"应用要显示什么", 而HostComponent决定"如何画到页面上"
 * @date: 2026/3/2
 */
function updateHostComponent(workInProgress: FiberNode) {
    const nextProps = workInProgress.pendingProps;
    const nextChildren = nextProps.children;
    reconcileChildren(workInProgress, nextChildren);
    return workInProgress.child;
}

/**
 * @title: 更新函数组件
 * @param: workInProgress 当前正在处理的FiberNode
 * @return: 返回子FiberNode 或 null，表示没有子节点
 * @description: 函数组件也是需要处理更新逻辑的，比如Hooks的调用
 * @date: 2026/3/3
 */

function updateFunctionComponent(workInProgress: FiberNode) {
    const nextChildren = renderWithHooks(workInProgress);
    reconcileChildren(workInProgress, nextChildren);
    return workInProgress.child;
}

/**
 * @title: 返回文本节点的FiberNode
 * @param: null
 * @return: null
 * @description: 返回文本节点的FiberNode,也就是null，表示没有子节点
 * @date: 2026/3/3
 */

function updateHostText() {
    // 没有子节点，直接返回 null
    return null;
}

/**
 * @title: 调度子节点
 * @param: workInProgress 当前正在处理的FiberNode; children 子节点的 ReactElement
 * @return: 返回子FiberNode
 * @description: 判断是更新阶段还是新增阶段，然后进行子节点的协调工作
 * 具体来说,根据wip的alternate属性是否为null，判断是更新阶段还是新增阶段
 * 如果alternate属性为null，则是新增阶段，调用mountChildFibers函数进行子节点的挂载工作
 * 如果alternate属性不为null，则是更新阶段，调用reconcileChildFibers函数进行子节点的更新工作
 * @date: 2026/3/3
 */
function reconcileChildren(
    workInProgress: FiberNode,
    children?: ReactElementType
) {
    // alternate 指向节点的备份节点，即 current
    const current = workInProgress.alternate;
    if (current !== null) {
        // 组件的更新阶段
        workInProgress.child = reconcileChildFibers(workInProgress, current?.child, children);
    } else {
        // 首屏渲染阶段
        workInProgress.child = mountChildFibers(workInProgress, null, children);
    }
}
