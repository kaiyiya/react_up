import React from 'react'
function Son(props) {
    console.log(props) // {name: "alien", age: "28", mes: "let us learn React !"}
    return <div> hello,world </div>
}
function Father(prop) {
    return React.cloneElement(prop.children, { mes: 'let us learn React !' })
}
export function IndexC() {
    return <Father>
        <Son name="alien" age="28" />
    </Father>
}
