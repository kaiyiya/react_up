import React, { memo, useEffect, useContext } from 'react'

const ThemeContext = React.createContext(null) // 主题颜色Context

const theme = { //主题颜色
    dark: { color: '#1890ff', background: '#1890ff', border: '1px solid blue', type: 'dark', },
    light: { color: '#fc4838', background: '#fc4838', border: '1px solid pink', type: 'light' }
}

/* input输入框 - useContext 模式 */
function Input(props) {
    const { color, border } = useContext(ThemeContext)
    const { label, placeholder } = props
    return <div>
        <label style={{ color }} >{label}</label>
        <input className="input" placeholder={placeholder} style={{ border }} />
    </div>
}
/* 容器组件 -  Consumer模式 */
function Box(props) {
    return <ThemeContext.Consumer>
        {(themeContextValue) => {
            const { border, color } = themeContextValue
            return <div className="context_box" style={{ border, color }} >
                {props.children}
            </div>
        }}
    </ThemeContext.Consumer>
}

function Checkbox(props) {
    const { label, name, onChange } = props
    const { type, color } = React.useContext(ThemeContext)
    return <div className="checkbox" onClick={onChange} >
        <label htmlFor="name" > {label} </label>
        <input type="checkbox" id={name} value={type} name={name} checked={type === name} style={{ color }} />
    </div>
}

// contextType 模式
class App extends React.PureComponent {
    static contextType = ThemeContext
    render() {
        const { border, setTheme, color, background } = this.context
        return <div className="context_app" style={{ border, color }}  >
            <div className="context_change_theme"   >
                <span> 选择主题： </span>
                <Checkbox label="light" name="light" onChange={() => setTheme(theme.light)} />
                <Checkbox label="dark" name="dark" onChange={() => setTheme(theme.dark)} />
            </div>
            <div className='box_content' >
                <Box >
                    <Input label="姓名：" placeholder="请输入姓名" />
                    <Input label="age：" placeholder="请输入年龄" />
                    <button className="searchbtn" style={{ background }} >确定</button>
                    <button className="concellbtn" style={{ color }} >取消</button>
                </Box>
                {/* <Box >
                    <HomeOutlined twoToneColor={color} />
                    <SettingFilled twoToneColor={color} />
                    <SmileOutlined twoToneColor={color} />
                    <SyncOutlined spin twoToneColor={color} />
                    <SmileOutlined twoToneColor={color} rotate={180} />
                    <LoadingOutlined twoToneColor={color} />
                </Box> */}
                <Box >
                    <div className="person_des" style={{ color: '#fff', background }}  >
                        I am alien  <br />
                        let us learn React!
                    </div>
                </Box>
            </div>
        </div>
    }
}

export default function DemoProvider5() {
    const [themeContextValue, setThemeContext] = React.useState(theme.dark)
    /* 传递颜色主题 和 改变主题的方法 */
    return <ThemeContext.Provider value={{ ...themeContextValue, setTheme: setThemeContext }} >
        <App />
    </ThemeContext.Provider>
}
