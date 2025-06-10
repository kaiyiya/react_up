import React from "react"
export default class CC extends React.Component {
    constructor(...arg) {
        super(...arg)                        /* 执行 react 底层 Component 函数 */
    }
    state = {}                              /* state */
    static number = 1                       /* 内置静态属性 */
    handleClick = () => console.log(111)     /* 方法： 箭头函数方法直接绑定在this实例上 */
    componentDidMount() {                    /* 生命周期 */
        console.log(CC.number, CC.number1) // 打印 1 , 2 
    }
    render() {                               /* 渲染函数 */
        return <button style={{ marginTop: '50px' }} onClick={this.handerClick}  >hello,React!</button>
    }
}
CC.number1 = 2                           /* 外置静态属性 */
CC.prototype.handleClick = () => console.log(222) /* 方法: 绑定在 CC 原型链的 方法*/