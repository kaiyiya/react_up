import React, { useRef, useEffect } from 'react'

function HOC(Component) {
    class Wrap extends React.Component {
        render() {
            const { forwardedRef, name } = this.props
            console.log(name, '00000000000');

            return <Component ref={forwardedRef}  {...this.props} good="gogogo" />
        }
    }
    return React.forwardRef((props, ref) => <Wrap forwardedRef={ref}  {...props} />)
}
class Index extends React.Component {
    constructor(props) {
        super(props)
    }
    render() {
        return <div>你</div>
    }
}
const HocIndex = HOC(Index)
export default () => {
    const node = useRef(null)
    useEffect(() => {
        console.log(node.current)  /* Index 组件实例  */

    }, [])
    return <div><HocIndex name="nihao" ref={node} /></div>
}
