import {
    Container,
    appendInitialChild,
    createInstance,
    createTextInstance
} from 'hostConfig';
import {FiberNode} from './fiber';
import {FunctionComponent, HostComponent, HostRoot, HostText} from './workTags';
import {NoFlags} from './fiberFlags';

// 生成更新计划，计算和收集更新 flags
/**
 * @title: 结束调和,生成更新计划
 * @param: workInProgress 要结束调和的 FiberNode
 * @return: 返回下一个要结束调和的 FiberNode
 * @description: 结束调和阶段，生成更新计划，计算和收集更新 flags
 * @date: 2026/3/3
 */
export const completeWork = (workInProgress: FiberNode) => {
    // 拿到新的属性
    const newProps = workInProgress.pendingProps;
    // 拿到当前的 FiberNode
    const current = workInProgress.alternate;
    switch (workInProgress.tag) {
        case HostRoot:
        case FunctionComponent:
            bubbleProperties(workInProgress);
            return null;

        case HostComponent:
            if (current !== null && workInProgress.stateNode) {
                // TODO: 组件的更新阶段
            } else {
                // 首屏渲染阶段
                // 构建 DOM
                const instance = createInstance(workInProgress.type, newProps);
                // 将 DOM 插入到 DOM 树中
                appendAllChildren(instance, workInProgress);
                workInProgress.stateNode = instance;
            }
            // 收集更新 flags
            bubbleProperties(workInProgress);
            return null;

        case HostText:
            if (current !== null && workInProgress.stateNode) {
                // TODO: 组件的更新阶段
            } else {
                // 首屏渲染阶段
                // 构建 DOM
                const instance = createTextInstance(newProps.content);
                workInProgress.stateNode = instance;
            }
            // 收集更新 flags
            bubbleProperties(workInProgress);
            return null;

        default:
            if (__DEV__) {
                console.warn('completeWork 未实现的类型', workInProgress);
            }
            return null;
    }
};
/**
 * @title: 将 wip 子树中的 Host 节点挂到同一 parent DOM 下
 * @param: parent Container; workInProgress FiberNode
 * @return: void
 * @description: 深度优先遍历 workInProgress 的子树，把其中所有 HostComponent/HostText 对应的 stateNode
 *               通过 appendInitialChild 依次挂到 parent 上，用于构建 parent 自身的 DOM 子树；
 *               不负责将 parent 插入根 container，真正挂载发生在提交阶段的 commitPlacement 中。
 * @date: 2026/3/3
 */

function appendAllChildren(parent: Container, workInProgress: FiberNode) {
    let node = workInProgress.child;
    while (node !== null) {
        if (node.tag == HostComponent || node.tag == HostText) {
            // 如果是原生DOM节点或者Text节点
            appendInitialChild(parent, node.stateNode);
        } else if (node.child !== null) {
            // 如果不是上述类型,但是有子节点,那么继续深入
            node.child.return = node;
            node = node.child;
            continue;
        }
        if (node == workInProgress) {
            return;
        }
        while (node.sibling === null) {
            // 没有兄弟就往上回溯,知道起点wip或者root
            if (node.return === null || node.return === workInProgress) {
                return;
            }
            node = node.return;
        }
        // 有兄弟就处理兄弟节点
        node.sibling.return = node.return;
        node=node.sibling;
    }
}

/**
 * @title: 收集更新 flags
 * @param: workInProgress 要收集更新 flags 的 FiberNode
 * @return: void
 * @description: 冒泡机制,收集子节点的flags和subtreeFlags，给wip设置
 * @date: 2026/3/3
 */
function bubbleProperties(workInProgress: FiberNode) {
    let subtreeFlags = NoFlags;
    let child = workInProgress.child;
    while (child !== null) {
        subtreeFlags |= child.subtreeFlags;
        subtreeFlags |= child.flags;

        child.return = workInProgress;//这一步可能是多余的,因为 child.return 已经赋值过了
        child = child.sibling;
    }

    workInProgress.subtreeFlags = subtreeFlags;
}
