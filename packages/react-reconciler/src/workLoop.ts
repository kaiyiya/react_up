import {FiberNode} from "./fiber";

let workInProgress: FiberNode | null = null

function renderRoot(root: FiberNode) {
    prepareFreshStack(root)
    try {
        workLoop()
    } catch (e) {
        console.log(e)
        workInProgress = null;
    }
}

//初始化workinprogress变量
function prepareFreshStack(root: FiberNode) {
    workInProgress = root
}

//深度优先遍历
function workLoop() {
    while (workInProgress !== null) {
        performUnitOfWork(workInProgress)
    }
}

function performUnitOfWork(fiber: FiberNode) {
    const next = beginWork(fiber)
    fiber.memoizedProps = fiber.pendingProps
    if (next === null) {
        completeUnitOfWork(fiber)
    } else {
        workInProgress = next
    }
}

function completeUnitOfWork(fiber: FiberNode) {
    let node: FiberNode | null = fiber
    do {
        completeWork(node)
        const sibling = node.sibling
        if (sibling !== null) {
            workInProgress = sibling
            return
        }
        node = node.return
        workInProgress = node

    } while (node !== null)
}
