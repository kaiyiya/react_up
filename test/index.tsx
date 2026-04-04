// @ts-ignore
const React = (window as any).React;
const ReactDOM = (window as any).ReactDOM;
const container = document.getElementById('root');

const resultPanel = document.createElement('pre');
resultPanel.id = 'test-results';
document.body.appendChild(resultPanel);

const writeLine = (message: string) => {
    resultPanel.textContent += `${message}\n`;
    console.log(message);
};

const assertEqual = (actual: unknown, expected: unknown, label: string) => {
    if (actual !== expected) {
        throw new Error(
            `${label}: expected ${String(expected)}, received ${String(actual)}`
        );
    }

    writeLine(`PASS ${label}`);
};

if (!container) {
    document.body.dataset.testStatus = 'failed';
    console.error('找不到 #root 元素');
} else {
    try {
        let setCount:
            | ((action: number | ((prevState: number) => number)) => void)
            | null = null;
        let initCalls = 0;

        function Counter() {
            const [count, updateCount] = React.useState(() => {
                initCalls += 1;
                return 0;
            });

            setCount = updateCount;

            return React.createElement('div', {id: 'counter'}, String(count));
        }

        const root = ReactDOM.createRoot(container);
        root.render(React.createElement(Counter));

        assertEqual(container.textContent, '0', 'mount 时渲染初始 state');
        assertEqual(initCalls, 1, 'lazy initializer 只在 mount 执行一次');

        if (setCount === null) {
            throw new Error('没有拿到 setCount');
        }

        const dispatchCount = setCount as (
            action: number | ((prevState: number) => number)
        ) => void;

        dispatchCount(1);
        assertEqual(container.textContent, '1', 'setState(value) 能更新 DOM');
        assertEqual(initCalls, 1, '普通更新不会重新执行 initializer');

        dispatchCount((prevState: number) => prevState + 1);
        assertEqual(
            container.textContent,
            '2',
            'setState(fn) 能基于上一次 state 更新'
        );
        assertEqual(initCalls, 1, '函数式更新也不会重新执行 initializer');

        document.body.dataset.testStatus = 'passed';
        writeLine('ALL TESTS PASSED');
    } catch (error) {
        document.body.dataset.testStatus = 'failed';
        console.error(error);
        writeLine(
            `FAIL ${error instanceof Error ? error.message : '未知测试错误'}`
        );
    }
}

