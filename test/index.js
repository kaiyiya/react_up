const React = window.React;
const ReactDOM = window.ReactDOM;
const container = document.getElementById("root");
const resultPanel = document.createElement("pre");
resultPanel.id = "test-results";
document.body.appendChild(resultPanel);
const writeLine = (message) => {
  resultPanel.textContent += `${message}
`;
  console.log(message);
};
const assertEqual = (actual, expected, label) => {
  if (actual !== expected) {
    throw new Error(
      `${label}: expected ${String(expected)}, received ${String(actual)}`
    );
  }
  writeLine(`PASS ${label}`);
};
if (!container) {
  document.body.dataset.testStatus = "failed";
  console.error("\u627E\u4E0D\u5230 #root \u5143\u7D20");
} else {
  try {
    let Counter = function() {
      const [count, updateCount] = React.useState(() => {
        initCalls += 1;
        return 0;
      });
      setCount = updateCount;
      return React.createElement("div", { id: "counter" }, String(count));
    };
    var Counter2 = Counter;
    let setCount = null;
    let initCalls = 0;
    const root = ReactDOM.createRoot(container);
    root.render(React.createElement(Counter));
    assertEqual(container.textContent, "0", "mount \u65F6\u6E32\u67D3\u521D\u59CB state");
    assertEqual(initCalls, 1, "lazy initializer \u53EA\u5728 mount \u6267\u884C\u4E00\u6B21");
    if (setCount === null) {
      throw new Error("\u6CA1\u6709\u62FF\u5230 setCount");
    }
    const dispatchCount = setCount;
    dispatchCount(1);
    assertEqual(container.textContent, "1", "setState(value) \u80FD\u66F4\u65B0 DOM");
    assertEqual(initCalls, 1, "\u666E\u901A\u66F4\u65B0\u4E0D\u4F1A\u91CD\u65B0\u6267\u884C initializer");
    dispatchCount((prevState) => prevState + 1);
    assertEqual(
      container.textContent,
      "2",
      "setState(fn) \u80FD\u57FA\u4E8E\u4E0A\u4E00\u6B21 state \u66F4\u65B0"
    );
    assertEqual(initCalls, 1, "\u51FD\u6570\u5F0F\u66F4\u65B0\u4E5F\u4E0D\u4F1A\u91CD\u65B0\u6267\u884C initializer");
    document.body.dataset.testStatus = "passed";
    writeLine("ALL TESTS PASSED");
  } catch (error) {
    document.body.dataset.testStatus = "failed";
    console.error(error);
    writeLine(
      `FAIL ${error instanceof Error ? error.message : "\u672A\u77E5\u6D4B\u8BD5\u9519\u8BEF"}`
    );
  }
}
