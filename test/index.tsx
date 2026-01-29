// @ts-ignore
const React = (window as any).React;
const ReactDOM = (window as any).ReactDOM;
const container = document.getElementById('root');
if (!container) {
    console.error('找不到 #root 元素');
} else {
    const root = ReactDOM.createRoot(container);
    const element = React.createElement('div', {}, 'Hello React');
    root.render(element);
}

