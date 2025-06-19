import React, { useState, useRef, useImperativeHandle, forwardRef } from 'react'
// 子组件
function Son(props, ref) {
    const inputRef = useRef(null)
    const [inputValue, setInputValue] = useState('')
    useImperativeHandle(ref, () => {
        const handleRefs = {
            onFocus() {              /* 声明方法用于聚焦input框 */
                inputRef.current.focus()
            },
            onChangeValue(value) {   /* 声明方法用于改变input的值 */
                setInputValue(value)
            }
        }
        return handleRefs
    }, [])
    return <div>
        <input placeholder="请输入内容" ref={inputRef} value={inputValue} />
    </div>
}

const ForwarSon = forwardRef(Son)
// 父组件
export default class Index extends React.Component {
    cur = null
    handerClick() {
        const { onFocus, onChangeValue } = this.cur
        onFocus() // 让子组件的输入框获取焦点
        onChangeValue('let us learn React!') // 让子组件input  
    }
    render() {
        return <div style={{ marginTop: '50px' }} >
            <ForwarSon ref={cur => (this.cur = cur)} />
            <button onClick={this.handerClick.bind(this)} >操控子组件</button>
        </div>
    }
}
