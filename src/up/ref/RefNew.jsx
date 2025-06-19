import React from 'react'
export default class IndexR extends React.Component {
    state = { num: 0 }
    node = null

    getDOm = (node) => {
        node = this.node
        console.log('此时的参数是什么：', this.node)
        console.log('此时的this是什么：', this.state.num);
    }


    render() {
        return <div >
            <div ref={this.getDOm}  >ref元素节点</div>
            <button onClick={() => this.setState({ num: this.state.num + 1 })} >点击</button>
        </div>
    }
}
