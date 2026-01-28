import {Container} from 'hostConfig';
import {FiberNode, FiberRootNode} from './fiber';
import {HostRoot} from './workTags';
import {
    UpdateQueue,
    creatUpdate,
    creatUpdateQueue,
    enqueueUpdate
} from './updateQueue';
import {ReactElementType} from 'shared/ReactTypes';
import {scheduleUpdateOnFiber} from './workLoop';

export function createContainer(container: Container) {
    const hostRootFiber = new FiberNode(HostRoot, {}, null);
    const root = new FiberRootNode(container, hostRootFiber);
    hostRootFiber.updateQueue = creatUpdateQueue();
    return root;
}

export function updateContainer(
    element: ReactElementType | null,
    root: FiberRootNode
) {
    const hostRootFiber = root.current;
    const update = creatUpdate<ReactElementType | null>(element);
    enqueueUpdate(
        hostRootFiber.updateQueue as UpdateQueue<ReactElementType | null>,
        update
    );
    scheduleUpdateOnFiber(hostRootFiber)
    return element;
}
