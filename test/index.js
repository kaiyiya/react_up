const React = window.React;
const ReactDOM = window.ReactDOM;
const container = document.getElementById("root");
if (!container) {
  console.error("\u627E\u4E0D\u5230 #root \u5143\u7D20");
} else {
  const root = ReactDOM.createRoot(container);
  const element = React.createElement("div", {}, "Hello React");
  root.render(element);
}
