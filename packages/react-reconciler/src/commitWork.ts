import {Container, appendChildToContainer} from 'hostConfig';
import {FiberNode, FiberRootNode} from './fiber';
import {
    ChildDeletion,
    MutationMask,
    NoFlags,
    Placement,
    Update
} from './fiberFlags';
import {HostComponent, HostRoot, HostText} from './workTags';

let nextEffect: FiberNode | null = null;
/**
 * @title: 提交 mutation 副作用
 * @param: finishedWork FiberNode
 * @return: void
 * @description: 以 finishedWork 为根，深度优先遍历整棵 Fiber 树，只在 flags/subtreeFlags
 *               含有 MutationMask 的分支上前进；遍历顺序是：优先向下钻到有 mutation 副作用的
 *               最深子节点，再自底向上依次处理当前节点及其兄弟节点，类似后序遍历。
 *               会处理包括根在内的所有需要提交的 mutation 副作用。
 * @date: 2026/3/3
 */

export const commitMutationEffects = (finishedWork: FiberNode) => {
    nextEffect = finishedWork;
    // 深度优先遍历 Fiber 树，寻找更新 flags
    while (nextEffect !== null) {
        // 向下遍历
        const child: FiberNode | null = nextEffect.child;
        if ((nextEffect.subtreeFlags & MutationMask) !== NoFlags && child !== null) {
            // 子节点存在 mutation 阶段需要执行的 flags
            nextEffect = child;
        } else {
            // 子节点不存在 mutation 阶段需要执行的 flags 或没有子节点
            // 向上遍历
            while (nextEffect !== null) {
                // 处理 flags
                commitMutationEffectsOnFiber(nextEffect);
                const sibling: FiberNode | null = nextEffect.sibling;
                // 遍历兄弟节点
                if (sibling !== null) {
                    nextEffect = sibling;
                    break;
                }
                // 遍历父节点
                nextEffect = nextEffect.return;
            }
        }
    }
};
/**
 * @title: 处理Fiber节点当前的副作用
 * @param:  finishedWork FiberNode
 * @return: void
 * @description: 处理当前节点的副作用,目前只做了插入阶段的
 * @date: 2026/3/3
 */

const commitMutationEffectsOnFiber = (finishedWork: FiberNode) => {
    const flags = finishedWork.flags;
    if ((flags & Placement) !== NoFlags) {
        commitPlacement(finishedWork);
        finishedWork.flags &= ~Placement;
    }
    if ((flags & Update) !== NoFlags) {
        // TODO Update
        finishedWork.flags &= ~Update;
    }
    if ((flags & ChildDeletion) !== NoFlags) {
        // TODO ChildDeletion
        finishedWork.flags &= ~ChildDeletion;
    }
};

/**
 * @title: 处理插入的副作用,将 FiberNode 对应的 DOM 插入 parent DOM 中
 * @param: finishedWork FiberNode
 * @return: void
 * @description:
 * @date: 2026/3/3
 */

const commitPlacement = (finishedWork: FiberNode) => {
    if (__DEV__) {
        console.log('执行 Placement 操作', finishedWork);
    }
    const hostParent = getHostParent(finishedWork);
    if (hostParent !== null) {
        appendPlacementNodeIntoContainer(finishedWork, hostParent);
    }
};

/**
 * @title: 获取当前 Fiber 对应的宿主父节点 DOM 容器
 * @param: fiber FiberNode
 * @return: Container 或 null
 * @description:
 *   从当前 fiber 向上沿着 return 链查找第一个宿主父节点：
 *   - 如果遇到 HostRoot，返回其 stateNode(FiberRootNode) 上的 container（根 DOM 容器）；
 *   - 如果遇到 HostComponent，返回该 fiber.stateNode（对应的原生 DOM 元素）；
 *   - 其他类型（函数组件等）会继续向上查找，直到找到宿主父节点或到达根。
 *   若整条链路上都未找到宿主父节点，则在开发环境下打印警告并返回 null。
 * @date: 2026/3/3
 */
const getHostParent = (fiber: FiberNode): Container | null => {
    let parent = fiber.return;
    while (parent !== null) {
        const parentTag = parent.tag;
        // 处理 Root 节点,也就是拿到了FiberRootNode的container
        if (parentTag === HostRoot) {
            return (parent.stateNode as FiberRootNode).container;
        }
        // 处理原生 DOM 元素节点
        if (parentTag === HostComponent) {
            return parent.stateNode as Container;
        } else {
            parent = parent.return;
        }
    }
    if (__DEV__) {
        console.warn('未找到 host parent', fiber);
    }
    return null;
};

/**
 * @title: 插入副作用真正插入到应用容器之中
 * @param: finishedWork FiberNode; hostParent Container
 * @return: void
 * @description: 给定一个 Fiber 节点 finishedWork 和它的宿主父节点 DOM hostParent，
 * 把这棵 Fiber 子树中所有的 HostComponent / HostText 对应的 DOM，
 * 一个个 appendChildToContainer 到同一个 hostParent 上。
 * @date: 2026/3/3
 */

const appendPlacementNodeIntoContainer = (
    finishedWork: FiberNode,
    hostParent: Container
) => {
    if (finishedWork.tag === HostComponent || finishedWork.tag === HostText) {
        appendChildToContainer(finishedWork.stateNode, hostParent);
    } else {
        const child = finishedWork.child;
        if (child !== null) {
            appendPlacementNodeIntoContainer(child, hostParent);
            let sibling = child.sibling;
            while (sibling !== null) {
                appendPlacementNodeIntoContainer(sibling, hostParent);
                sibling = sibling.sibling;
            }
        }
    }
};
