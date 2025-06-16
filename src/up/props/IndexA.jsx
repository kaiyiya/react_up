import React from 'react';
function Son(props) {
    console.log(props)
    return <div> hello,world </div>
}
function Father(props){
    const fatherProps={
        mes:'let us learn React !'
    }
    return <Son {...props} { ...fatherProps }  />
}
export function IndexA(){
    const indexProps = {
        name:'alien',
        age:'28',
    }
    return <Father { ...indexProps }  />
}
