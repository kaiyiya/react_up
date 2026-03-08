import { ReactElementType } from 'shared/ReactTypes';
import { FiberNode, createFiberFromElement } from './fiber';
import { REACT_ELEMENT_TYPE } from 'shared/ReactSymbols';
import { HostText } from './workTags';
import { Placement } from './fiberFlags';

/**
 * @title: 调度子节点
 * @params: 是否追踪副作用
 * @return: reconcileChildFibers 函数
 * @description:
 * @date: 2026/3/3
 */

function ChildReconciler(shouldTrackSideEffects: boolean) {
	/**
	 * @title: 处理单个 Element 节点
	 * @params: returnFiber 父 FiberNode
	 * @params: currentFiber 当前 FiberNode
	 * @params: element ReactElement
	 * @return: workInProgress FiberNode形成双向链表结构,新的fiber节点的return属性指向父fiber节点，父fiber节点的child属性指向新的fiber节
	 * @description: 点
	 * @date: 2026/3/3
	 */
	function reconcileSingleElement(
		returnFiber: FiberNode,
		currentFiber: FiberNode | null,
		element: ReactElementType
	) {
		const fiber = createFiberFromElement(element);
		fiber.return = returnFiber;
		return fiber;
	}

	/**
	 * @title: 处理单个文本节点
	 * @params: returnFiber 父 FiberNode
	 * @params: currentFiber 当前 FiberNode
	 * @params: content 文本内容
	 * @return: workInProgress FiberNode
	 * @description: 形成双向链表结构,新的fiber节点的return属性指向父fiber节点，
	 * 父fiber节点的child属性指向新的fiber节点,只不过这里是文本节点，没有子节点
	 * @date: 2026/3/3
	 */
	function reconcileSingleTextNode(
		returnFiber: FiberNode,
		currentFiber: FiberNode | null,
		content: string | number
	) {
		const fiber = new FiberNode(HostText, { content }, null);
		fiber.return = returnFiber;
		return fiber;
	}

	/**
	 * @title: 为 Fiber 节点添加更新 flags
	 * @params: fiber FiberNode
	 * @return: workInProgress FiberNode
	 * @description: 标记单个 fiber 节点的更新 flags
	 * @date: 2026/3/3
	 */
	function placeSingleChild(fiber: FiberNode) {
		// 首屏渲染且追踪副作用时，才添加更新 flags
		if (shouldTrackSideEffects && fiber.alternate == null) {
			fiber.flags |= Placement;
		}
		return fiber;
	}

	/**
	 * @title: 根据 shouldTrackSideEffects 返回不同 reconcileChildFibers 的实现
	 * @params: returnFiber 父 FiberNode
	 * @params: currentFiber 当前 FiberNode
	 * @params: newChild 新的子节点
	 * @return: reconcileChildFibers 函数
	 * @description: 这里闭包的作用是返回不同 reconcileChildFibers 的实现，根据 shouldTrackSideEffects 的值
	 * 主要是为了简化写法,并且提高性能,如果不闭包,则需要在函数内部再次判断 shouldTrackSideEffects 的值
	 * @date: 2026/3/3
	 */
	return function reconcileChildFibers(
		returnFiber: FiberNode,
		currentFiber: FiberNode | null,
		newChild?: any
	) {
		// 判断当前 fiber 的类型,如果是单个 Element 节点,
		if (typeof newChild == 'object' && newChild !== null) {
			switch (newChild.$$typeof) {
				case REACT_ELEMENT_TYPE:
					return placeSingleChild(reconcileSingleElement(returnFiber, currentFiber, newChild));
				default:
					if (__DEV__) {
						console.warn('未实现的 reconcile 类型', newChild);
					}
					break;
			}
		}
		// 多个 Element 节点
		if (Array.isArray(newChild)) {
			// TODO: 暂时不处理
			if (__DEV__) {
				console.warn('未实现的 reconcile 类型', newChild);
			}
		}

		// 文本节点
		if (typeof newChild == 'string' || typeof newChild == 'number') {
			return placeSingleChild(reconcileSingleTextNode(returnFiber, currentFiber, newChild));
		}

		if (__DEV__) {
			console.warn('未实现的 reconcile 类型', newChild);
		}
		return null;
	};
}

// 组件的更新阶段中，追踪副作用
export const reconcileChildFibers = ChildReconciler(true);

// 首屏渲染阶段中不追踪副作用，只对根节点执行一次 DOM 插入操作
export const mountChildFibers = ChildReconciler(false);
