import React from "react"
// 孙组件
function Son(props) {
    const { grandRef, name } = props
    return <div>
        <div> i am alien{name} </div>
        <span ref={grandRef} >这个是想要获取元素</span>
    </div>
}
// 父组件
class Father extends React.Component {
    constructor(props) {
        super(props)

    }
    shouldComponentUpdate(nextProps, nextState) {
        console.log('shouldComponentUpdate', { nextProps, nextState })
        return false
    }
    render() {
        return <div>
            <Son grandRef={this.props.grandRef} name={'are you alien'} />
        </div>
    }
}
const NewFather = React.forwardRef((props, ref) => <Father grandRef={ref} name={'are you alien'}  {...props} />)
// 爷组件
export default class GrandFather extends React.Component {
    constructor(props) {
        super(props)
    }
    state = { node: null }
    componentDidMount() {
        console.log(this.state.node) // span #text 这个是想要获取元素
    }
    static getDerivedStateFromProps(nextProps, prevState) {
        console.log(prevState.node,'-----------');

        return prevState;
    }
    render() {
        return <div>
            <NewFather ref={(node) => { this.setState({ node: node }) }} />
        </div>
    }
}
