import React from 'react';

class LifecycleDemo extends React.Component {
    // 1. 构造函数 (初始化state和绑定方法)
    constructor(props) {
        super(props);
        console.log('1. constructor');
        this.state = {
            count: -100,
            snapshotTest: null
        };
        this.handleClick = this.handleClick.bind(this);
    }

    // 2. 静态方法，从props派生state (在初始挂载和更新时都会调用)
    static getDerivedStateFromProps(nextProps, prevState) {
        console.log('2. getDerivedStateFromProps', { nextProps, prevState });
        // 通常用于props变化时更新state
        if (nextProps.initialCount !== prevState.count) {
            if (nextProps.initialCount > prevState.count)
                return { count: nextProps.initialCount };
            return { count: prevState.count };
        }
        return null;
    }

    // // 3. 即将过时的挂载前方法 (不推荐使用)
    // UNSAFE_componentWillMount() {
    //     console.log('3. UNSAFE_componentWillMount');
    // }

    // // 4. 即将过时的props接收方法 (不推荐使用)
    // UNSAFE_componentWillReceiveProps(nextProps) {
    //     console.log('4. UNSAFE_componentWillReceiveProps', nextProps);
    // }

    // // 5. 即将过时的更新前方法 (不推荐使用)
    // UNSAFE_componentWillUpdate(nextProps, nextState) {
    //     console.log('5. UNSAFE_componentWillUpdate', { nextProps, nextState });
    // }

    // 6. 渲染方法 (必须的)
    render() {
        console.log('6. render');
        return (
            <div className="lifecycle-demo">
                <h2>生命周期演示</h2>
                <p>计数: {this.state.count}</p>
                <p>父组件传递的初始值: {this.props.initialCount}</p>
                <button onClick={this.handleClick}>增加计数</button>
            </div>
        );
    }

    // 7. 获取更新前快照 (在DOM更新前调用)
    getSnapshotBeforeUpdate(prevProps, prevState) {
        console.log('7. getSnapshotBeforeUpdate', { prevProps, prevState });
        // 返回的值会传递给componentDidUpdate
        return { fromSnapshot: '更新前快照数据' };
    }

    // 8. 更新完成方法
    componentDidUpdate(prevProps, prevState, snapshot) {
        console.log('8. componentDidUpdate', {
            prevProps,
            prevState,
            currentState: this.state,
            snapshot
        });
    }

    // 9. 挂载完成方法 (适合网络请求)
    componentDidMount() {
        console.log('9. componentDidMount');
    }

    // 10. 性能优化方法 (决定是否重新渲染)
    shouldComponentUpdate(nextProps, nextState) {
        console.log('10. shouldComponentUpdate', { nextProps, nextState });
        // 只有当计数变化时才更新
        return nextState.count !== this.state.count;

    }

    // 11. 卸载前清理方法 (清除定时器/取消请求)
    componentWillUnmount() {
        console.log('11. componentWillUnmount');
    }

    // 自定义方法
    handleClick() {
        this.setState(prevState => ({
            count: prevState.count + 1
        }));
    }
}

export default class LifeCycleComponent extends React.Component {
    state = {
        showDemo: true,
        initialCount: 9998,
        version: 1
    };

    toggleComponent = () => {
        this.setState(prev => ({ showDemo: !prev.showDemo }));
    };

    changeProps = () => {
        this.setState(prev => ({
            initialCount: Math.floor(Math.random() * 10),
            version: prev.version + 1
        }));
    };

    render() {
        return (
            <div className="parent-component">
                <h1>React生命周期演示</h1>
                <button onClick={this.toggleComponent}>
                    {this.state.showDemo ? '卸载组件' : '挂载组件'}
                </button>
                <button onClick={this.changeProps}>更改Props</button>

                {this.state.showDemo && (
                    <LifecycleDemo
                        key={this.state.version} // 强制重新创建组件
                        initialCount={this.state.initialCount}
                        onUnmount={this.toggleComponent}
                    />
                )}
            </div>
        );
    }
}