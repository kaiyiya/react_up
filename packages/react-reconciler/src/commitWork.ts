import {FiberNode, FiberRootNode} from "./fiber";
import {MutationMask, NoFlags, Placement} from "./fiberFlags";
import {HostComponent, HostRoot, HostText} from "./workTags";
import {appendChildToContainer, Container} from "react-dom/src/hostConfig";

let nextEffect: FiberNode | null = null//指向下一个执行的副作用节点
export const commitMutationEffects = (finishedWork: FiberNode) => {
    nextEffect = finishedWork
    while (nextEffect !== null) {
        const child: FiberNode | null = nextEffect.child
        if (((nextEffect.subtreeFlags & MutationMask) !== NoFlags) && child !== null) {
            nextEffect = child
        } else {
            //     向上遍历
            up:while (nextEffect !== null) {
                commitMutationEffectOnFiber(finishedWork)
                const sibling: FiberNode | null = nextEffect.sibling
                if (sibling !== null) {
                    nextEffect = sibling
                    break up;
                }
                nextEffect = nextEffect.return
            }

        }
    }

}
const commitMutationEffectOnFiber = (finishedWork: FiberNode) => {
    const flags = finishedWork.flags
    if ((flags & Placement) !== NoFlags) {
        commitPlacement(finishedWork)
        finishedWork.flags &= ~Placement
    }

}
const commitPlacement = (finishedWork: FiberNode) => {
//     插入操作
    if (__DEV__) {
        console.warn('commitPlacement', finishedWork)
    }
    const hostParent = getHostParent(finishedWork)


}

function getHostParent(fiber: FiberNode): Container {
    let parent = fiber.return
    while (parent) {
        const parentTag = parent.tag
        if (parentTag === HostComponent) {
            return parent.stateNode as Container
        }
        if (parentTag === HostRoot) {
            return (parent.stateNode as FiberRootNode).container
        }
        parent = parent.return
    }
    if (__DEV__) {
        console.warn('未找到 host parent')
    }
}

function appendPlacementNodeIntoContainer(finishedWork: FiberNode, hostParent: Container) {
    if (finishedWork.tag === HostComponent || finishedWork.tag === HostText) {
        appendChildToContainer(hostParent, finishedWork.stateNode)
        return
    }
    const child = finishedWork.child
    if (child !== null) {
        appendPlacementNodeIntoContainer(child, hostParent)
        let sibling = child.sibling
        while (sibling !== null) {
            appendPlacementNodeIntoContainer(sibling, hostParent)
            sibling = sibling.sibling
        }
    }
}
