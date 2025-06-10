import React from "react"
import ReactDOM from 'react-dom'
const { unstable_batchedUpdates } = ReactDOM

export default class Index extends React.Component {
    state = { number: 0 }
    handleClick = () => {
        //   this.setState({ number:this.state.number + 1 },()=>{   console.log( 'callback1', this.state.number)  })

        //   console.log(this.state.number)
        //   this.setState({ number:this.state.number + 1 },()=>{   console.log( 'callback2', this.state.number)  })
        //   console.log(this.state.number)
        //   this.setState({ number:this.state.number + 1 },()=>{   console.log( 'callback3', this.state.number)  })
        //   console.log(this.state.number)

        setTimeout(() => {
            unstable_batchedUpdates(() => {
                this.setState({ number: this.state.number + 1 }, () => { console.log('callback3', this.state.number) })
                console.log(this.state.number)
                this.setState({ number: this.state.number + 1 }, () => { console.log('callback3', this.state.number) })
                console.log(this.state.number)
                this.setState({ number: this.state.number + 1 }, () => { console.log('callback3', this.state.number) })
                console.log(this.state.number)
            })
        })

    }
    handleClick1 = () => {
        setTimeout(() => {
            this.setState({ number: 1 }, () => { console.log('callback1', this.state.number) })
        })
        this.setState({ number: 2 }, () => { console.log('callback2', this.state.number) })
        ReactDOM.flushSync(() => {
            this.setState({ number: 3 }, () => { console.log('callback3', this.state.number) })
        })
        this.setState({ number: 4 }, () => { console.log('callback4', this.state.number) })
    }
    handleClick3 = () => {
        this.setState({ number: 2 })
        this.setState({ number: this.state.number + 1 })
        this.setState({ number: this.state.number + 2 })
    }


    render() {
        console.log(this.state.number);

        return <div>
            {this.state.number}
            <button onClick={this.handleClick3}>number++</button>
        </div>
    }
} 
