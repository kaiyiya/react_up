import React from "react"

export default class Form extends React.Component {
    state = {
        formData: {}
    }
    /* 用于提交表单数据 */
    submitForm = (cb) => {
        cb({ ...this.state.formData })
    }
    /* 获取重置表单数据 */
    resetForm = () => {
        const { formData } = this.state
        Object.keys(formData).forEach(item => {
            formData[item] = ''
        })
        this.setState({
            formData
        })
    }
    /* 设置表单数据层 */
    setValue = (name, value) => {
        this.setState({
            formData: {
                ...this.state.formData,
                [name]: value
            }
        })
    }
    logb = () => {
        console.log("111111111777777777777");
    }
    render() {
        const { children } = this.props
        const renderChildren = []
        React.Children.forEach(children, (child) => {
            if (child.type.displayName === 'formItem') {
                const { name } = child.props
                /* 克隆`FormItem`节点，混入改变表单单元项的方法 */
                const Children = React.cloneElement(child, {
                    key: name,                             /* 加入key 提升渲染效果 */
                    handleChange: this.setValue,           /* 用于改变 value */
                    value: this.state.formData[name] || '', /* value 值 */
                }, child.props.children)
                renderChildren.push(Children)
            }
        })
        return renderChildren
    }
}
/* 增加组件类型type  */
Form.displayName = 'form'