import React from "react"
/* 子组件 */
export function Children({ number }) {
    console.log('子组件渲染')
    return <div>let us learn React!  {number} </div>
}
/* 父组件 */
export default class Render1 extends React.Component {
    state = {
        numberA: 0,
        numberB: 0,
    }
    render() {
        return <div>
            <Children number={this.state.numberA} />
            <button onClick={() => this.setState({ numberA: this.state.numberA + 1 })} >改变numberA -{this.state.numberA} </button>
            <button onClick={() => this.setState({ numberB: this.state.numberB + 1 })} >改变numberB -{this.state.numberB}</button>
        </div>
    }

}
