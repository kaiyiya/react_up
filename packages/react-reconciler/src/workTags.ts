export type WorkTag =
    | typeof FunctionComponent
    | typeof HostRoot
    | typeof HostComponent
    | typeof HostText;//节点类型

export const FunctionComponent = 0;//函数组件
export const HostRoot = 3;//ReactDom.createRoot().render()
export const HostComponent = 5;//<div></div>
export const HostText = 6;//'hello'
