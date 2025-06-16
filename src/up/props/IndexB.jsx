import React from 'react'
function Son(props) {
    console.log(props)
    return <div> hello,world </div>
}

function Father(props) {
    const { age, ...fatherProps1 } = props
    return <Son  {...fatherProps1} />
}
export function IndexB() {
    const indexProps = {
        name: 'alien',
        age: '28',
        mes: 'let us learn React !'
    }
    return <Father {...indexProps} />
}
