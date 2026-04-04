import {FiberNode, FiberRootNode, createWorkInProgress} from './fiber';
import {beginWork} from './beginWork';
import {completeWork} from './completeWork';
import {HostRoot} from './workTags';
import {MutationMask, NoFlags} from './fiberFlags';
import {commitMutationEffects} from './commitWork';

let workInProgress: FiberNode | null = null;

/**
 * @title: 调度更新
 * @params: fiber 更新的 Fiber 节点
 * @return: void
 * @description: 调度更新，从触发更新的节点开始，向上遍历到 FiberRootNode，然后开始调和过程
 * @date: 2026/3/3
 */
export function scheduleUpdateOnFiber(fiber: FiberNode) {
    const root = markUpdateFromFiberToRoot(fiber);
    renderRoot(root);
}

/**
 * @title: 从触发更新的节点向上遍历到 FiberRootNode
 * @params: fiber 触发更新的 Fiber 节点
 * @return: FiberRootNode
 * @description: 从触发更新的节点开始，向上遍历到 FiberRootNode
 * @date: 2026/3/3
 */
function markUpdateFromFiberToRoot(fiber: FiberNode) {
    let node = fiber;
    while (node.return !== null) {
        node = node.return;
    }
    if (node.tag == HostRoot) {
        return node.stateNode;
    }
    return null;
}

/**
 * @title: 渲染根 Fiber 节点
 * @params: root 根 Fiber 节点
 * @return: void
 * @description: 调度更新，从根 Fiber 节点开始，进行调和过程
 * 主要分为以下几步:
 * 1.创建工作InProgress Fiber 节点 wip
 * 2.进行workLoop，深度优先遍历
 * 3.完成调和过程，生成新的 Fiber 树
 * 4.提交阶段，将新的 Fiber 树应用到 DOM 上
 * @date: 2026/3/3
 */
function renderRoot(root: FiberRootNode) {
    // 初始化 workInProgress 变量
    prepareFreshStack(root);
    do {
        try {
            // 深度优先遍历
            workLoop();
            break;
        } catch (e) {
            console.warn('workLoop发生错误：', e);
            workInProgress = null;
        }
    } while (true);

    // 创建根 Fiber 树的 Root Fiber
    const finishedWork = root.current.alternate;
    // finishedWork 表示当前完成的 Fiber 树的根节点
    root.finishedWork = finishedWork;
    // 提交阶段
    commitRoot(root);
}

/**
 * @title: 准备新的 Fiber 节点
 * @params: root 根 Fiber 节点
 * @return: void
 * @description: 创建一个工作中的 Fiber 节点，用于后续的调和过程
 * @date: 2026/3/3
 */
function prepareFreshStack(root: FiberRootNode) {
    workInProgress = createWorkInProgress(root.current, {});
}

/**
 * @title: 工作循环
 * @params: void
 * @return: void
 * @description: 深度优先遍历，进行调和过程,直到没有可调和的 Fiber 节点为止
 * @date: 2026/3/3
 */
function workLoop() {
    while (workInProgress !== null) {
        performUnitOfWork(workInProgress);
    }
}

/**
 * @title: 执行当前工作节点
 * @params: fiber FiberNode
 * @return: void
 * @description: 分为以下几个步骤:
 * 1.调用 beginWork，比较并返回子 FiberNode
 * 2.如果没有子节点，则调用 completeUnitOfWork，完成调和过程
 * 3.如果有子节点，则继续向下深度遍历
 * @date: 2026/3/3
 */

function performUnitOfWork(fiber: FiberNode) {
    // 比较并返回子 FiberNode
    const next = beginWork(fiber);
    fiber.memorizedProps = fiber.pendingProps;

    if (next == null) {
        // 没有子节点，则遍历兄弟节点或父节点
        completeUnitOfWork(fiber);
    } else {
        // 有子节点，继续向下深度遍历
        workInProgress = next;
    }
}

/**
 * @title: 完成调和过程
 * @params: fiber FiberNode
 * @return: void
 * @description: 从当前 Fiber 节点开始，向上遍历，完成调和过程
 * @date: 2026/3/3
 */

function completeUnitOfWork(fiber: FiberNode) {
    let node: FiberNode | null = fiber;
    do {
        completeWork(node);
        // 有兄弟节点，则遍历兄弟节点
        const sibling = node.sibling;
        if (sibling !== null) {
            workInProgress = sibling;
            return;
        }
        // 否则向上返回，遍历父节点
        node = node.return;
        workInProgress = node;
    } while (node !== null);
}
/**
 * @title: 提交阶段入口
 * @params: root FiberRootNode
 * @return: void
 * @description: 以 root.finishedWork 为根，执行提交阶段：
 *               先根据 flags/subtreeFlags 判断是否存在需要处理的副作用，
 *               若存在则遍历整棵 finishedWork 树执行 commitMutationEffects，
 *               最后将 root.current 切换为 finishedWork，完成新旧 Fiber 树的替换。
 * @date: 2026/3/3
 */

function commitRoot(root: FiberRootNode) {
    const finishedWork = root.finishedWork;//接力棒,起到新旧树切换的衔接作用
    if (finishedWork === null) {
        return;
    }

    if (__DEV__) {
        console.log('commit 阶段开始');
    }

    // 重置
    root.finishedWork = null;

    // 判断是否存在 3 个子阶段需要执行的操作
    const subtreeHasEffects = (finishedWork.subtreeFlags & MutationMask) !== NoFlags;
    const rootHasEffects = (finishedWork.flags & MutationMask) !== NoFlags;

    if (subtreeHasEffects || rootHasEffects) {
        // TODO: BeforeMutation

        // Mutation
        commitMutationEffects(finishedWork);
        // Fiber 树切换，workInProgress 变成 current
        root.current = finishedWork;

        // TODO: Layout
    } else {
        root.current = finishedWork;
    }
}
