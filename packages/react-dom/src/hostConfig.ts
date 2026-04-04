import {FiberNode} from 'react-reconciler/src/fiber';
import {HostComponent, HostText} from 'react-reconciler/src/workTags';

export type Container = Element;
export type Instance = Element;
export type TextInstance = Text;

const isIgnoredProp = (key: string) =>
    key === 'children' || key === 'key' || key === 'ref';

const isEventProp = (key: string) => key.startsWith('on');

function removeProp(node: Element, key: string) {
    if (isIgnoredProp(key) || isEventProp(key)) {
        return;
    }

    if (key === 'className') {
        node.removeAttribute('class');
        return;
    }

    if (key === 'style') {
        (node as HTMLElement).removeAttribute('style');
        return;
    }

    if (key in node) {
        try {
            (node as any)[key] = '';
            return;
        } catch {
            // ignore and fallback to removeAttribute
        }
    }

    node.removeAttribute(key);
}

function setProp(node: Element, key: string, value: any) {
    if (isIgnoredProp(key) || isEventProp(key)) {
        return;
    }

    if (value == null || value === false) {
        removeProp(node, key);
        return;
    }

    if (key === 'className') {
        node.setAttribute('class', String(value));
        return;
    }

    if (key === 'style' && typeof value === 'object') {
        Object.assign((node as HTMLElement).style, value);
        return;
    }

    if (key in node) {
        (node as any)[key] = value;
        return;
    }

    node.setAttribute(key, String(value));
}

function updateDomProperties(node: Element, prevProps: any, nextProps: any) {
    for (const key in prevProps) {
        if (
            Object.hasOwn(prevProps, key) &&
            !Object.hasOwn(nextProps, key)
        ) {
            removeProp(node, key);
        }
    }

    for (const key in nextProps) {
        if (!Object.hasOwn(nextProps, key)) {
            continue;
        }

        if (prevProps[key] !== nextProps[key]) {
            setProp(node, key, nextProps[key]);
        }
    }
}

/**
 * @title: 创建 DOM 元素
 * @params:  type 元素类型，props 元素属性
 * @return: 创建的 DOM 元素
 * @description:
 * 调用原生 DOM API 创建元素
 * @date: 2026/3/3
 */

export const createInstance = (type: string, porps: any): Instance => {
    const element = document.createElement(type);
    updateDomProperties(element, {}, porps);
    return element;
};
/**
 * @title: 添加初始的子元素
 * @params:  parent 父元素，child 子元素
 * @return: void
 * @description:
 * 调用原生 DOM API 将子元素添加到父元素中
 * @date: 2026/3/3
 */

export const appendInitialChild = (
    parent: Instance | Container,
    child: Instance
) => {
    parent.appendChild(child);
};
/**
 * @title: 创建文本元素
 * @params:  content 文本内容
 * @return: 创建的文本元素,类型为 Text
 * @description:
 * @date: 2026/3/3
 */

export const createTextInstance = (content: string) => {
    const element = document.createTextNode(content);
    return element;
};
/**
 * @title: 将子元素添加到容器中
 * @params:  child 子元素，parent 父元素
 * @return: void
 * @description:
 * 调用原生 DOM API 将子元素添加到父元素中
 * @date: 2026/3/3
 */
export const appendChildToContainer = (
    child: Instance,
    parent: Instance | Container
) => {
    parent.appendChild(child);
};

export const commitTextUpdate = (
    textInstance: TextInstance,
    content: string
) => {
    textInstance.textContent = content;
};

export const commitUpdate = (fiber: FiberNode) => {
    switch (fiber.tag) {
        case HostComponent: {
            const prevProps = fiber.alternate?.memorizedProps ?? {};
            const nextProps = fiber.memorizedProps ?? {};
            updateDomProperties(fiber.stateNode as Instance, prevProps, nextProps);
            return;
        }
        case HostText:
            commitTextUpdate(fiber.stateNode as TextInstance, fiber.memorizedProps.content);
            return;
        default:
            if (__DEV__) {
                console.warn('commitUpdate 未实现的类型', fiber);
            }
    }
};
