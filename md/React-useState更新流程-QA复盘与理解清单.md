---
title: React useState 更新流程：问答复盘与理解清单（当前阶段版）
date: 2026-04-01
tags: [React, useState, Fiber, hooks, 更新流程, commit]
categories: 前端
keywords: useState dispatchSetState scheduleUpdateOnFiber renderWithHooks updateState updateWorkInProgressHook processUpdateQueue Fiber current workInProgress commitUpdate
description: 以当前仓库实现为准，专门梳理 useState 在首屏渲染完成之后的更新链路，帮助串起 Hook、Fiber、render 与 commit。
cover:
top_img:
---

本文默认你已经熟悉 **首屏渲染**。所以这里不再从 `createRoot().render()` 的第一次挂载重讲，而是直接从一个更实际的问题开始：

**首屏已经渲染完成，页面上已经有内容了；这时调用一次 `setState`，到底发生了什么？**

本文继续使用 **问题 + 完整答案** 的形式整理，并且 **以你当前仓库这一步的实现为准**：

- **同步更新**
- **从根重新进入 render**
- **Hook 更新队列先按单个 `pending` 来理解**
- **先不展开 `useEffect`、lane、批量更新、数组 diff**

---

## 第一部分：首屏渲染结束后，useState 手里到底多了什么？

### Q1：首屏渲染结束后，和 `useState` 更新最相关的成果是什么？

**答案：**

- 页面上已经有了 **current 树**，也就是 **`root.current`** 指向的那棵 Fiber 树。
- 对于函数组件来说，这个函数组件对应的 Fiber 上，已经挂好了 **Hook 链表**，入口在 **`fiber.memorizedState`**。
- 这条 Hook 链表里的每个 Hook，至少保存两类东西：
  - **`memorizedState`**：这个 Hook 当前记住的状态值。
  - **`queue`**：这个 Hook 自己的更新队列。
- `queue` 上还会挂一个 **`dispatch`**，也就是我们平时拿到的那个 `setState`。

换句话说，首屏结束后，`useState` 不是“消失了”，而是已经变成了：

- Fiber 上的一条 Hook 链表
- Hook 上的当前状态
- Hook 上的更新队列
- 队列上的 `dispatch`

这四者一起构成了“下一次更新”的起点。

---

### Q2：首屏 mount 时返回的 `setState`，本质上是什么？

**答案：**

在你当前实现里，mount 阶段的 `useState` 会做两件关键事：

- 创建当前 Hook 对应的 `queue`
- 把 `dispatchSetState.bind(null, fiber, queue)` 存到 `queue.dispatch` 上

所以 `setState` 的本质不是某个“魔法函数”，而是一个 **提前绑定了两个参数的函数**：

- 它知道自己属于哪个 Fiber
- 它知道自己要往哪个 Hook 的 `queue` 里塞更新

这也是为什么后面你调用 `setCount(1)` 时，它能知道“这次更新属于哪个组件、哪个 Hook”。

---

### Q3：为什么 `setState` 不直接改 `hook.memorizedState`，而是要先进队列？

**答案：**

因为 React 的核心思想不是“立刻改值”，而是：

- **先记录这次想怎么改**
- **再在下一轮 render 里统一计算新状态**

这样做的好处是：

- 状态计算统一发生在 render 期间，流程稳定。
- 函数组件会重新执行，新的 JSX 会和新的状态自然对应起来。
- 后面扩展到批量更新、优先级、跳过低优先级更新时，模型也不需要推翻重来。

所以你可以把 `setState` 理解成：

**不是直接改状态，而是“发起一次更新请求”。**

---

## 第二部分：调用一次 setState，更新是怎么被发起的？

### Q4：当我们调用 `setCount(1)` 时，第一步发生了什么？

**答案：**

调用 `setCount(1)` 时，会进入 `dispatchSetState(fiber, updateQueue, action)`。

它会做两件事：

- 用本次传入的 `action` 创建一个 `Update`
- 把这个 `Update` 放进当前 Hook 的 `updateQueue.shared.pending`

这里的 `action` 有两种常见形态：

- **值更新**：`setCount(1)`，此时 `action` 就是 `1`
- **函数更新**：`setCount(prev => prev + 1)`，此时 `action` 就是这个函数

在你当前项目阶段里，可以先把这一步理解成：

**“把这次更新意图先记到账上。”**

---

### Q5：更新入队之后，为什么会调用 `scheduleUpdateOnFiber`？

**答案：**

因为“队列里有更新”还不够，React 还得真正开始一次新的 render。

所以 `dispatchSetState` 在入队之后会继续调用：

`scheduleUpdateOnFiber(fiber)`

这个调用的意思是：

**从当前触发更新的 Fiber 出发，一路往上找到根，然后从根重新渲染整棵树。**

这点非常重要。`useState` 更新虽然发生在函数组件里，但真正启动 render 的入口仍然是 **根**，不是从函数组件半路直接开始。

---

### Q6：为什么子组件里的 `setState`，也要回到根去渲染？

**答案：**

因为你当前这套协调流程的统一入口就是根：

- `renderRoot`
- `finishedWork`
- `commitRoot`

这些都挂在 `FiberRootNode` 上。

也就是说：

- **更新可能来自任意子 Fiber**
- 但 **render / commit 只能从根组织起来**

所以 `scheduleUpdateOnFiber` 必须先做一件事：

**沿着 `return` 指针一路向上，找到 `HostRoot`，再拿到 `FiberRootNode`。**

---

## 第三部分：从根重新 render 时，到底重新做了什么？

### Q7：`scheduleUpdateOnFiber` 找到根之后，会立刻做什么？

**答案：**

会进入 `renderRoot(root)`。

而 `renderRoot` 的第一步，是准备一棵新的 **workInProgress 树**：

- 调用 `createWorkInProgress(root.current, {})`
- 以当前的 current 树为基础，创建本轮要工作的 wip 根 Fiber

这里就是双缓冲最关键的地方：

- **旧树**：`current`
- **新树**：`workInProgress`

本轮更新不是直接在 current 树上改，而是在它的“对照树”上重新走一遍 render。

---

### Q8：这时候根上有新的 `element` 吗？如果没有，为什么还要从根开始 render？

**答案：**

这是 `useState` 更新里一个很容易混淆的点。

和首屏渲染不同，`useState` 更新时：

- 根上的 `updateQueue` 往往没有新的 ReactElement
- 根的 `memorizedState` 里还是之前那棵 element 树

但是，**即使根 element 没变，整棵树也仍然要从根重新走一遍 render**，原因是：

- 你需要重新走到目标函数组件
- 你需要在那一层重新执行函数组件
- 你需要让 Hook 在新的 render 里算出新 state

所以这轮更新不是“根变了”，而是：

**从根重新走流程，最终在某个函数组件里消费掉 Hook 队列里的更新。**

---

### Q9：根 beginWork 时，如果根状态没变，它还做什么？

**答案：**

根的 `beginWork` 仍然会执行 `updateHostRoot`：

- 读取根自己的 `updateQueue`
- 调用 `processUpdateQueue`
- 得到 `nextChildren`
- 再进入 `reconcileChildren`

如果根上没有新的 update，那么 `nextChildren` 仍然是之前那棵 element 树。

但这并不意味着“什么都没做”。真正关键的是后面这一步：

**`reconcileChildren` 会基于旧的 child Fiber，重新生成这一轮的子 Fiber。**

也就是说，虽然根 element 没变，但从根往下的 Fiber 工作流仍然重新启动了。

---

## 第四部分：更新是如何重新走到函数组件的？

### Q10：这次为什么不会像首屏那样一路新建 Fiber，而是要复用旧 Fiber？

**答案：**

因为更新阶段和挂载阶段最大的区别就是：

- 首屏 mount：很多节点没有旧 Fiber，只能创建新的
- update：大部分节点在结构没变时，应该 **复用旧 Fiber**

你当前项目这一步，已经补上了最基础的复用逻辑：

- 如果 `key` 相同、`type` 相同，就复用旧 Fiber
- 如果是文本节点，并且旧节点也是 `HostText`，就复用旧 Fiber

这里复用的本质不是“直接拿旧 Fiber 继续改”，而是：

- 以旧 Fiber 为模板
- 调用 `createWorkInProgress`
- 生成它对应的 **新 wip Fiber**

所以更准确地说，这里是：

**复用旧节点的身份和历史数据，生成当前这轮工作的 wip 节点。**

---

### Q11：为什么 `useState` 更新必须先有 Fiber 复用，后面 Hook update 才能成立？

**答案：**

因为 Hook update 的关键前提是：

**当前这轮的函数组件 Fiber，要能通过 `alternate` 找到上一轮那个函数组件 Fiber。**

只有找到上一轮那个 Fiber，你才能拿到：

- 上一轮的 Hook 链表入口
- 上一轮每个 Hook 的 `memorizedState`
- 上一轮每个 Hook 的 `queue`

如果你更新时还像首屏一样每次都新建一个完全独立的 Fiber，那就没有办法沿着 `alternate` 去找到“上一次那个 Hook”了。

所以可以把单节点复用理解成：

**Hook update 的前置条件。**

---

## 第五部分：真正进入 Hook update 时，发生了什么？

### Q12：为什么这次函数组件里执行 `useState`，走的是 update 而不是 mount？

**答案：**

因为在 `renderWithHooks(workInProgress)` 里，会先看：

`const current = workInProgress.alternate`

如果 `alternate !== null`，说明：

- 这个函数组件不是第一次出现
- 它有上一轮对应的 Fiber

于是 `currentDispatcher.current` 会被设置为 **`HooksDispatcherOnUpdate`**。

这意味着同样一行：

`const [count, setCount] = useState(0)`

在 mount 阶段会走 `mountState`，在 update 阶段会走 `updateState`。

---

### Q13：`updateState` 的第一步为什么不是算 state，而是先拿 Hook？

**答案：**

因为函数组件里可能不止一个 Hook。

React 不是靠名字找 Hook，而是靠：

- 本轮 render 正在处理第几个 Hook
- 上一轮 render 的第几个 Hook 是谁

所以 `updateState` 的第一步，是调用：

`updateWorkInProgressHook()`

它的任务是：

- 从旧 Fiber 的 Hook 链表里，找到“当前位置对应的旧 Hook”
- 把它复制成当前 wip Fiber 上的新 Hook
- 让当前 wip Fiber 也重新挂起一条新的 Hook 链表

这里的关键词是：

**旧 Hook 不是被原地修改，而是被“读出来，再复制到新 Fiber 上”。**

---

### Q14：`updateWorkInProgressHook` 具体帮我们做了什么？

**答案：**

它做了四件关键事：

1. 找到上一轮对应位置的 Hook
2. 读取它的 `memorizedState`
3. 读取它的 `queue`
4. 创建一个新的 Hook 节点，挂到当前 wip Fiber 的 Hook 链表上

所以 update 阶段的 Hook 链表，是“本轮重新搭出来的”，但里面的初始数据来自上一轮。

你可以把它理解成：

- 旧 Fiber 上有“上一轮 Hook 链表”
- 新 Fiber 上要重新生成“这一轮 Hook 链表”
- 两者通过 `alternate` 和当前位置一一对应

这也是为什么 Hook 必须“按固定顺序调用”，不能条件判断里乱放。

---

### Q15：`updateState` 真正算新 state 的时机是什么？

**答案：**

在 `updateState` 里，拿到当前 Hook 之后，会继续：

- 读取 `hook.queue.shared.pending`
- 如果有更新，就调用 `processUpdateQueue`

这一步才是真正计算新 state 的地方。

也就是说，状态不是在 `dispatchSetState` 里算出来的，而是：

**在下一轮 render 的 `updateState` 里，结合旧 state 和 pending update 算出来的。**

---

### Q16：`processUpdateQueue` 在当前阶段到底怎么理解最合适？

**答案：**

在你当前仓库这一步，可以先把它理解成一个非常朴素的模型：

- 输入：旧 state + 一个 pending update
- 输出：新 state

然后分两种情况：

- 如果 `action` 是值：直接把 state 改成这个值
- 如果 `action` 是函数：用 `action(baseState)` 算出新值

所以：

- `setCount(1)` 是“直接赋值”
- `setCount(prev => prev + 1)` 是“基于旧值计算”

这就是为什么函数式更新能天然拿到上一次 state。

---

## 第六部分：state 算出来以后，怎么影响页面？

### Q17：`updateState` 算出新 state 之后，页面会立刻更新吗？

**答案：**

不会立刻进入 DOM。

`updateState` 算出的是：

- 当前 Hook 的新 `memorizedState`
- 函数组件本轮 render 时拿到的 state 值

接下来函数组件会继续执行完，返回新的 JSX，也就是新的 `children`。

所以更准确地说：

- `updateState` 负责 **算状态**
- 函数组件执行负责 **产出新的 UI 描述**
- 后面的 reconciler / commit 负责 **把 UI 变化落到 DOM**

---

### Q18：如果函数组件返回的结构没变，为什么页面文字还能变？

**答案：**

因为“结构没变”和“内容没变”不是一回事。

以这个组件为例：

```tsx
function Counter() {
  const [count, setCount] = useState(0);
  return <div>{count}</div>;
}
```

当 `count` 从 `0` 变到 `1` 时：

- 外层还是 `div`
- 子节点还是文本节点
- 结构没变

但文本节点的内容从 `0` 变成了 `1`

所以这轮更新更像是：

- Fiber 尽量复用
- 宿主节点尽量复用
- 只在必要位置打 `Update` 标记

---

### Q19：当前这一步里，`Update flag` 是在哪里打上的？

**答案：**

在 `completeWork` 阶段。

你当前已经补上的逻辑是：

- `HostComponent` 更新时，如果 props 变了，就打 `Update`
- `HostText` 更新时，如果文本内容变了，就打 `Update`

所以这一步的语义是：

**render 阶段先判断“这个宿主节点需不需要更新”，如果需要，就先做标记，不在这里直接改 DOM。**

---

### Q20：真正改 DOM 的动作发生在哪？

**答案：**

发生在 commit 阶段，也就是 `commitMutationEffects` 里。

如果某个 Fiber 带有 `Update` flag，就会进入：

- `commitUpdate(finishedWork)`

在你当前项目里，这一步已经能处理：

- `HostText`：更新 `textContent`
- `HostComponent`：更新 props

这也是 React 一直强调的两阶段分工：

- **render 阶段**：计算、比较、打标记
- **commit 阶段**：执行真实 DOM 变更

---

### Q21：那 `root.current = finishedWork` 和 useState 更新有什么关系？

**答案：**

关系非常大。

因为在 commit 结束时，React 会把：

- 本轮刚刚完成的 wip 树

切换成新的：

- current 树

也就是执行：

`root.current = finishedWork`

这一步之后，新的 Hook 链表、新的 `memorizedState`、新的 Fiber 关系，才真正成为“下一轮更新的起点”。

所以 `useState` 更新不是只改了 DOM，它还改了：

- 当前树是谁
- 当前 Hook 链表是谁
- 下一轮 update 将从哪棵树继续出发

---

## 第七部分：几个最容易混的点

### Q22：为什么 `useState` 更新时，根节点好像“没更新”，却还是重新 render 了？

**答案：**

因为“根有没有新 element”与“是否需要重新 render”是两件事。

`useState` 更新时：

- 根的 element 通常没变
- 但子树里的某个 Hook 队列里有新 update

而 render 的入口只能从根组织，因此仍然必须：

- 找到根
- 从根重新开始
- 再在函数组件处消费 Hook 更新

所以这轮 render 的意义不是“根变了”，而是：

**根负责重新发起这轮工作。**

---

### Q23：为什么 `setState(fn)` 能拿到“上一次 state”，而不是初始 state？

**答案：**

因为函数式更新不是在 mount 阶段算的，而是在 update 阶段的 `processUpdateQueue` 里算的。

那时传进去的 `baseState`，就是：

**当前 Hook 上一次 render 结束后记住的 state**

所以：

`setCount(prev => prev + 1)`

本质是：

`newState = action(oldState)`

而不是：

`newState = action(initialState)`

---

### Q24：为什么说“Hook 链表”和“Fiber 双缓冲”要一起理解？

**答案：**

因为 Hook 并不是独立存在的，它始终挂在 Fiber 上。

所以每次更新时，实际上发生的是两层复制：

- Fiber：从 current 复制到 workInProgress
- Hook：从旧 Fiber 上的 Hook 链表，复制到新 Fiber 上的 Hook 链表

因此你要把整个更新过程看成：

**不是“某个变量改了”，而是“新树在构建时，顺手把新的 Hook 状态也建出来了”。**

---

## 第八部分：一句话总线

### Q25：只用一句话，把当前阶段的 `useState` 更新流程串起来？

**答案：**

**首屏结束后，函数组件 Fiber 上已经挂好 Hook 链表与 `dispatch`；调用 `setState` 时只是把 update 放进 Hook 队列并从当前 Fiber 往上调度到根；根重新进入 render，函数组件在 `renderWithHooks` 中走 update 分支，复用旧 Hook、消费队列、算出新 state，再由 `completeWork` 打 `Update` 标记，最后在 commit 阶段把变化更新到真实 DOM，并切换 `root.current`。**

---

## 第九部分：这一节你必须能回答的 5 个问题

### Q26：为什么 `setState` 不直接改变量？

**答案：**

因为 React 要把“状态计算”放到下一轮 render 里统一完成，而不是在事件触发点直接改值。

---

### Q27：为什么更新要从根开始，而不是直接从函数组件开始？

**答案：**

因为 render / commit 的统一入口在 `FiberRootNode`，任何子树更新最后都要回到根来组织整棵树的工作。

---

### Q28：为什么 update 阶段必须复用 Fiber？

**答案：**

因为只有复用旧 Fiber，当前 wip Fiber 才能通过 `alternate` 找到上一轮的 Hook 链表与历史状态。

---

### Q29：为什么 `updateState` 先取 Hook，再算 state？

**答案：**

因为 React 是按“第几个 Hook”来定位的，必须先找到当前位置对应的旧 Hook，才能读取它的旧状态和队列。

---

### Q30：为什么 render 阶段已经知道文本变了，却不直接改 DOM？

**答案：**

因为 render 阶段只负责计算和打标记，真正的 DOM 修改统一放在 commit 阶段执行。

---

如果你接下来继续往下学，最自然的下一步就是：

**把本文里的 useState 更新链路，再和“单节点复用 + HostText 的 Update 提交”一起对照代码走一遍。**

这样你会从“知道流程”进入“能自己从代码里走流程”。
