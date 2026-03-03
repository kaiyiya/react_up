export type Container = Element;
export type Instance = Element;
/**
 * @title: 创建 DOM 元素
 * @param:  type 元素类型，props 元素属性
 * @return: 创建的 DOM 元素
 * @description:
 * 调用原生 DOM API 创建元素
 * @date: 2026/3/3
 */

export const createInstance = (type: string, porps: any): Instance => {
    // TODO: 处理 props
    const element = document.createElement(type);
    return element;
};
/**
 * @title: 添加初始的子元素
 * @param:  parent 父元素，child 子元素
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
 * @param:  content 文本内容
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
 * @param:  child 子元素，parent 父元素
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
