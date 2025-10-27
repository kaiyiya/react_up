import React from "react"
import { Children } from "./Render1"
export default class Render2 extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            numberA: 0,
            numberB: 0,
        }
        this.component = <Children number={this.state.numberA} />
    }
    controllComponentRender = () => { /* 通过此函数判断 */
        const { props } = this.component
        if (props.number !== this.state.numberA) { /* 只有 numberA 变化的时候，重新创建 element 对象  */
            return this.component = React.cloneElement(this.component, { number: this.state.numberA })
        }
        return this.component
    }
    render() {
        return <div>
            {this.controllComponentRender()}
            <button onClick={() => this.setState({ numberA: this.state.numberA + 1 })} >改变numberA</button>
            <button onClick={() => this.setState({ numberB: this.state.numberB + 1 })}  >改变numberB</button>
        </div>
    }
}
import { useMemo } from "react"
export function Render2Index() {
    const [numberA, setNumberA] = React.useState(0)
    const [numberB, setNumberB] = React.useState(0)
    return <div>
        {useMemo(() => <Children number={numberA} />, [numberA])}
        <button onClick={() => setNumberA(numberA + 1)} >改变numberA</button>
        <button onClick={() => setNumberB(numberB + 1)} >改变numberB</button>
    </div>
}
