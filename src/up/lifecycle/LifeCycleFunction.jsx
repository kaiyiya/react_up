import React from "react"
import { useState } from "react"
import { useEffect } from "react"
export function FunctionLifecycle(props) {
    const [num, setNum] = useState(0)
    React.useEffect(() => {
        /* 请求数据 ， 事件监听 ， 操纵dom  ， 增加定时器 ， 延时器 */
        console.log('组件挂载完成：componentDidMount')
        return function componentWillUnmount1() {
            /* 解除事件监听器 ，清除 */
            console.log('组件销毁：componentWillUnmount')
        }
    }, [])/* 切记 dep = [] */
    React.useEffect(() => {
        console.log('props变化：componentWillReceiveProps')
    }, [props])
    React.useEffect(() => { /*  */
        console.log(' 组件更新完成：componentDidUpdate ')
    })
    return <div>
        <div> props : {props.number} </div>
        <div> states : {num} </div>
        <button onClick={() => setNum(state => state + 1)}   >改变state</button>
    </div>
}

export default function LifeCycleFunction() {
    const [number, setNumber] = React.useState(0)
    const [isRender, setRender] = React.useState(true)
    return <div>
        {isRender && <FunctionLifecycle number={number} />}
        <button onClick={() => setNumber(state => state + 1)} > 改变props  </button> <br />
        <button onClick={() => setRender(false)} >卸载组件</button>
    </div>
}
