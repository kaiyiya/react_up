import {Props, Key, Ref, ReactElementType} from 'shared/ReactTypes';
import {FunctionComponent, HostComponent, WorkTag} from './workTags';
import {NoFlags, Flags} from './fiberFlags';
import {Container} from 'react-dom/src/hostConfig';

export class FiberNode {
    tag: WorkTag;
    key: Key;
    stateNode: any;// 节点对应的实际 DOM 节点或组件实例
    type: any;
    return: FiberNode | null;
    sibling: FiberNode | null;
    child: FiberNode | null;// 指向节点的第一个子节点
    index: number;
    ref: Ref;
    pendingProps: Props;// 表示节点的新属性，用于在协调过程中进行更新
    memorizedPros: Props | null;// 已经更新完的属性
    memorizedState: any; // 更新完成后新的 State
    alternate: FiberNode | null;// 指向节点的备份节点，用于在协调过程中进行比较
    flags: Flags;// 表示节点的副作用类型，如更新、插入、删除等
    subtreeFlags: Flags;// 表示子节点的副作用类型，如更新、插入、删除等
    updateQueue: unknown;// 更新计划队列

    constructor(tag: WorkTag, pendingProps: Props, key: Key) {
        // 类型
        this.tag = tag;
        this.key = key;
        this.ref = null;
        this.stateNode = null;
        this.type = null; // 节点的类型，可以是原生 DOM 元素、函数组件或类组件等

        // 构成树状结构
        this.return = null; // 指向节点的父节点
        this.sibling = null; // 指向节点的下一个兄弟节点
        this.child = null;
        this.index = 0; // 索引

        // 作为工作单元
        this.pendingProps = pendingProps;
        this.memorizedPros = null;
        this.memorizedState = null;
        this.updateQueue = null;
        this.alternate = null;
        this.flags = NoFlags;
        this.subtreeFlags = NoFlags;
    }
}

/**
 * @title: 整个应用对应的 Fiber 根节点容器
 * @description:
 * - container: 真实渲染目标（如 DOM 容器），即 createRoot 传入的根节点
 * - current: 当前已提交的 Fiber 树根（HostRoot fiber），代表“当前屏幕上的那棵树”
 * - finishedWork: 一轮 render 阶段完成后待提交的 Fiber 树根（HostRoot wip），在 commitRoot 中切换为 current
 * 通过 FiberRootNode，将真实容器与 current / finishedWork 两棵 Fiber 树关联起来，作为调度和提交的统一入口。
 */
export class FiberRootNode {
    container: Container;
    current: FiberNode;
    finishedWork: FiberNode | null;

    constructor(container: Container, hostRootFiber: FiberNode) {
        this.container = container;
        this.current = hostRootFiber;
        // 将根节点的 stateNode 属性指向 FiberRootNode，用于表示整个 React 应用的根节点
        hostRootFiber.stateNode = this;
        // 指向更新完成之后的 hostRootFiber
        this.finishedWork = null;
    }
}

/**
 * @title: 创建 workInProgress
 * @params: current 当前 Fiber 节点
 * @params: pendingProps 新的属性
 * @return: FiberNode
 * @description: 创建新的 workInProgress 节点，并复制当前节点的大部分属性，用于在协调过程中进行更新
 * @date: 2026/3/3
 */

export const createWorkInProgress = (
    current: FiberNode,
    pendingProps: Props
): FiberNode => {
    let workInProgress = current.alternate;
    if (workInProgress == null) {
        // 首屏渲染时（mount）
        workInProgress = new FiberNode(current.tag, pendingProps, current.key);
        workInProgress.stateNode = current.stateNode;

        // 双缓冲机制
        workInProgress.alternate = current;
        current.alternate = workInProgress;
    } else {
        // 非首屏渲染时（update）
        workInProgress.pendingProps = pendingProps;
        // 将 effect 链表重置为空，以便在更新过程中记录新的副作用
        workInProgress.flags = NoFlags;
        workInProgress.subtreeFlags = NoFlags;
    }
    // 复制当前节点的大部分属性
    workInProgress.type = current.type;
    workInProgress.updateQueue = current.updateQueue;
    workInProgress.child = current.child;
    workInProgress.memorizedPros = current.memorizedPros;
    workInProgress.memorizedState = current.memorizedState;

    return workInProgress;
};

/**
 * @title: 根据 DOM 节点创建新的 Fiber 节点
 * @params: element React 元素
 * @return: FiberNode
 * @description: 必须是 DOM 元素，不能是函数组件或类组件
 * @date: 2026/3/3
 */
export function createFiberFromElement(element: ReactElementType): FiberNode {
    const {type, key, props} = element;
    let fiberTag: WorkTag = FunctionComponent;
    if (typeof type == 'string') {
        // 如: <div/> 的 type: 'div'
        fiberTag = HostComponent;
    } else if (typeof type !== 'function' && __DEV__) {
        console.warn('未定义的 type 类型', element);
    }

    const fiber = new FiberNode(fiberTag, props, key);
    fiber.type = type;
    return fiber;
}
