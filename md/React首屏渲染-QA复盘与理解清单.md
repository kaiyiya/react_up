---
title: React 首屏渲染：问答复盘与理解清单（完整问答版）
date: 2026-03-24
tags: [React, Fiber, reconciler, 首屏渲染, beginWork, completeWork, commit]
categories: 前端
keywords: FiberRootNode createRoot render updateQueue processUpdateQueue beginWork completeWork commit Placement mountChildFibers reconcileChildFibers 双缓冲
description: 首屏渲染相关概念以「问题 + 完整答案」形式整理，便于自测与复盘。
cover: 
top_img: 
---

本文把首屏渲染链路、易混点、进阶概念和自检项，全部写成 **问题 + 答案**。可直接当自测题库用。

---

## 第一部分：入口、调度与更新队列（原 1～4 题）

### Q1：`createRoot` 和第一次 `render` 分别做什么？谁创建了 `FiberRootNode`？

**答案：**

- **`createRoot(container)`**：调用内部的 **`createContainer(container)`**，创建 **`FiberRootNode`**（保存真实 DOM 容器、当前 Fiber 树根 `current` 等），并创建 **`HostRoot` 类型的根 Fiber**，挂上 **`updateQueue`**。对外返回 `{ render }`。
- **第一次 `root.render(element)`**：走 **`updateContainer(element, root)`**：把本次要渲染的内容包装成 **`Update`**，**入队**到根 Fiber 的 `updateQueue.shared.pending`，再 **`scheduleUpdateOnFiber`**，触发 **`renderRoot` → workLoop → beginWork/completeWork → commitRoot** 一整轮。
- **`FiberRootNode` 是谁创建的**：在 **`createContainer`** 里 **`new FiberRootNode(container, hostRootFiber)`**，根 Fiber 的 **`stateNode`** 指向这个 `FiberRootNode`。

---

### Q2：`scheduleUpdateOnFiber` 为什么要从当前 Fiber 一直往上找到根？根上「整棵树渲染」必须有什么？

**答案：**

- **为什么要找根**：协调器的 **`renderRoot`**、**`finishedWork`**、**`commitRoot`** 都挂在 **`FiberRootNode`** 上。无论从哪个 Fiber 触发更新，都要 **回到 `FiberRootNode`** 才能启动「整棵树」的 render/commit。这不是泛泛的「规范」，而是 **架构上的单一入口**。
- **根上必备的是什么**：**`FiberRootNode` 本体**（含 **`container`**：如 `#root` DOM）、**`current` 指针**（指向当前已提交的根 Fiber）、以及本次渲染结束时用于提交的 **`finishedWork`**。**`flags` / `subtreeFlags` / `stateNode`** 是 **各个 Fiber 节点**上随阶段积累的信息，不是「根节点专有、缺一不可的三件套」。

---

### Q3：`HostRoot` 的 `updateQueue.shared.pending` 里存的是什么？首屏时 `processUpdateQueue` 如何得到 `memorizedState`？

**答案：**

- **`pending`**：存的是 **尚未被处理的 `Update`**（在你这套实现里常是 **单次赋值**；React 生产实现里可能是链表，此处以你仓库为准）。根上首屏一般是 **`Update { action: ReactElement }`**，即 **`render` 传进来的那棵 element**。
- **`processUpdateQueue(baseState, pendingUpdate)`**：若 `pendingUpdate` 非空，取出 **`action`**。若 **`action` 是函数**，则 **`memorizedState = action(baseState)`**（类 useState 更新）；若 **不是函数**，则 **`memorizedState = action`**。首屏根更新时 **`action` 就是 ReactElement（值）**，走 **直接赋值** 分支，于是 **`memorizedState` 就是这次要渲染的 element**，供后面 **`reconcileChildren`** 使用。

---

### Q4：`action` 为什么有时是函数有时是值？首屏根节点属于哪一种？

**答案：**

- **`Action<State>`** 类型设计为 **`State | ((prevState: State) => State)`**，这样 **同一套更新队列**既能表达 **「直接换成新状态」**，也能表达 **「根据旧状态算新状态」**（如 `useState` 的函数式更新）。
- **首屏根节点**：`render` 传入的是 **ReactElement**，**不是函数**，因此 **`action` 作为值**，**`memorizedState` 即为该 element**。

---

## 第二部分：beginWork / completeWork 与遍历（原 5～7 题）

### Q5：`beginWork` 返回的「下一个工作单元」是什么？没有子节点时 `performUnitOfWork` 接下来走哪？

**答案：**

- **`beginWork` 的返回值**：**下一个要处理的 Fiber**，通常是 **当前节点的第一个子节点 `child`**；若没有子节点，则返回 **`null`**（如 `HostText` 的 `updateHostText`）。
- **`performUnitOfWork`**：若 **`next !== null`**，**`workInProgress = next`**，继续 **向下**；若 **`next === null`**，调用 **`completeUnitOfWork(fiber)`**，进入 **向上回溯**（`completeWork` + 兄弟或父）。

---

### Q6：`completeWork` 里如何创建 DOM、如何把子 DOM 接到父 DOM？和 `bubbleProperties` 的关系？

**答案：**

- **按 `tag` 分支**：**`HostRoot` / `FunctionComponent`** 等可能只做 **`bubbleProperties`**；**`HostComponent`** 首屏：**`createInstance(type, props)`** 创建宿主 DOM → **`appendAllChildren(parent, wip)`** 把 **已生成好的子 DOM**（在子 Fiber 的 `completeWork` 里已挂到 `stateNode`）**接到当前父 DOM** → **`workInProgress.stateNode = instance`** → **`bubbleProperties`**。**`HostText`**：**`createTextInstance(content)`** → **`stateNode`** → **`bubbleProperties`**。
- **`bubbleProperties`**：遍历 **`child` 链表**，把子节点的 **`flags` / `subtreeFlags`** 合并到当前节点的 **`subtreeFlags`**，便于 **commit 阶段**判断子树是否有 **Mutation** 等副作用。

---

### Q7：为什么说深度优先？`beginWork` 和 `completeWork` 各负责哪一半？

**答案：**

- **深度优先**：用 **`child` / `sibling` / `return`** 模拟 **先一路向下（begin），再回溯向上（complete）**，等价于经典 DFS，只是 **非递归**、用 **`workInProgress` 指针**驱动。
- **`beginWork`**：**「向下展开」**——根据节点类型处理 **更新队列或 props**，**`reconcileChildren`** 生成子 Fiber，**返回第一个子**，让工作循环继续 **深入子树**。
- **`completeWork`**：**「向上收尾」**——子 Fiber 侧已经 **begin/complete 完**，本层创建 **宿主节点**，**拼好子 DOM**，**冒泡 flags**，再通过 **`completeUnitOfWork`** 处理 **兄弟** 或 **父**。

---

## 第三部分：协调子节点与 Placement（原 8～9 题）

### Q8：`mountChildFibers` 和 `reconcileChildFibers` 有什么差别？参数 `true/false` 影响什么？

**答案：**

- 二者都来自 **`ChildReconciler(shouldTrackSideEffects)`**，内部逻辑共用，差别在 **`placeSingleChild`**：**仅当 `shouldTrackSideEffects && fiber.alternate == null` 时**，才 **`fiber.flags |= Placement`**。
- **`mountChildFibers = ChildReconciler(false)`**：**不打 Placement**（在你这段实现里）。
- **`reconcileChildFibers = ChildReconciler(true)`**：**首屏子节点（`alternate == null`）会打 Placement**。
- **因此**：不是「只有第一次 render 用 false、以后永远 true」这么简单；**凡是走 mount 子树协调的路径**都可能用 **`mountChildFibers(false)`**，**更新阶段对比子节点**用 **`reconcileChildFibers(true)`** 更常见。要以调用 **`reconcileChildren` 时 `current` 是否为 null** 为准。

---

### Q9：`current === null` 时为什么走 `mountChildFibers`？和更新阶段比少做了什么？

**答案：**

- **`current === null`** 表示 **尚无 alternate / 尚无已提交的子树**，属于 **首次挂载子树**，走 **`mountChildFibers`**。
- **与更新阶段相比**：更新阶段 **`current !== null`**，走 **`reconcileChildFibers`**，会 **对比旧 Fiber 与新 element**，并 **按 `placeSingleChild` 规则打 Placement 等 flags**。**mount 路径在你代码里不打 Placement**，少的是 **这类副作用标记**（具体行为以 `childFiber.ts` 为准）。

---

## 第四部分：commit 与 Placement 语义（原 10～11 题）

### Q10：`render` 阶段结束后，什么时候切换 `root.current`？`finishedWork` 是什么？

**答案：**

- **`render` 阶段**（**workLoop** 跑完）会产出 **`finishedWork`**（在你仓库里常见写法是 **指向本次完成的根 Fiber**，即 **workInProgress 树根**）。
- **`root.current` 的切换**发生在 **`commitRoot`** 里：在 **Mutation（如 `commitMutationEffects`）之后**（或 **判定无需 Mutation 的分支**），执行 **`root.current = finishedWork`**，完成 **current 树与本次树的指针切换**。
- **`finishedWork`**：**本轮渲染提交时的根 Fiber**，作为 **整棵新树的入口**。

---

### Q11：`commitPlacement` 里的 Placement 和 `completeWork` 里已经创建好的 DOM 是什么关系？

**答案：**

- **`completeWork`**：**在父宿主节点内部** 用 **`appendAllChildren`** 等把 **子 DOM** 拼进 **父 DOM**，**子树内部结构**在此时已存在。
- **`commitPlacement`**：对 **仍带有 `Placement` flag** 的 Fiber，**在宿主树里找到父容器**（**`getHostParent`**），执行 **`appendChildToContainer`** 等，把 **该节点对应 DOM（或子树）挂到宿主父节点**。这是 **整棵树对外的「插入点」**（例如挂到 **`#root`**），**不是**把 `completeWork` 里造好的 DOM「推翻重来」，而是 **补做「尚未挂到最终宿主父」的那一步**（是否每条路径都打 Placement 取决于 mount/reconcile 配置）。

---

## 第五部分：总线（原 12 题）

### Q12：用一句话串起来：从 `root.render(jsx)` 到用户在页面上看到内容，经历哪些阶段？

**答案：**

可记为：**更新入队（`updateContainer`）→ 调度从根渲染（`renderRoot` / `workLoop`）→ Render 子阶段（`beginWork` 展开 Fiber、`completeWork` 创建宿主节点并冒泡 flags）→ Commit 子阶段（`commitRoot`，按需 `commitMutationEffects` 等，把 Placement 等副作用落到宿主树，最后 `root.current = finishedWork`）**。用户可见内容依赖 **宿主 DOM 已挂到页面容器**（由 **complete + commit** 共同完成，具体分工见 Q6、Q11）。

---

## 第六部分：进阶概念（完整问答）

### Q13：为什么既要 `beginWork` 又要 `completeWork`？

**答案：**

- **`beginWork`**：负责 **「是否还有子节点要处理」** —— 处理更新、**生成/连接子 Fiber**，返回 **下一个工作单元**。
- **`completeWork`**：负责 **「本层宿主节点是否可以生成」** —— 子 Fiber 已从 begin 路径上处理完，才能 **安全创建本层 DOM 并挂载子 DOM**。二者配合实现 **DFS**，避免在子树未展开时提前 complete 父节点。

---

### Q14：双缓冲指什么？

**答案：**

- **`root.current`**：指向 **上一轮 commit 后** 页面对应的 Fiber 树（**current 树**）。
- **本轮在内存中构建的是 workInProgress 树**（`finishedWork` 为其根）。**commitRoot** 末尾 **`root.current = finishedWork`**，完成 **两棵树角色的交换**（概念上；实现上是指针切换）。

---

### Q15：`mountChildFibers(false)` 若不给子打 Placement，首屏子树最终如何挂到 `#root`？

**答案：**

- 需结合你仓库 **是否** 在 **其它路径**（例如 **根**、**commit**）仍产生 **Placement** 或 **直接操作 container**。若子树 **全程无 Placement**，则 **依赖 `completeWork` 里已把子 DOM 挂到父 DOM、并最终在根下一次性挂 container** 的设计；**若仍无挂载**，则属于实现缺口，需要看 **`commitPlacement` / `appendChildToContainer`** 是否在 **根子节点**上被触发。**结论**：以 **`childFiber.ts` 的 flags** 与 **`commitWork.ts` / `hostConfig`** 的实际调用为准，不能死记一句「一定在 commit 才挂上」。

---

### Q16：`bubbleProperties` 收集的 `subtreeFlags` 在 `commitRoot` 里怎么用？

**答案：**

- **`commitRoot`** 里会判断 **`finishedWork.subtreeFlags`**（及根 **`flags`**）与 **`MutationMask`** 等：**若子树含需 Mutation 的副作用**，则进入 **`commitMutationEffects(finishedWork)`**；否则可能 **跳过 Mutation**，但仍会 **`root.current = finishedWork`**。**`subtreeFlags`** 是 **从叶到根冒泡上来的「子树副作用摘要」**。

---

### Q17：为什么用 `current !== null` 区分 `reconcileChildFibers` 与 `mountChildFibers`？

**答案：**

- **`current !== null`**：存在 **旧 Fiber**，需要 **diff**（协调更新），用 **`reconcileChildFibers`**。
- **`current === null`**：**无旧子树**，属于 **首次挂载该子树**，用 **`mountChildFibers`**。**判据**就是 **是否存在 alternate 对应的子树**（以 `workInProgress.alternate` / `current` 为准，具体见 `beginWork.ts` 里 `reconcileChildren`）。

---

## 第七部分：实操自检（完整问答）

### Q18：`FiberRootNode` 与 `HostRoot` Fiber 谁挂在谁上？各自的 `stateNode` 是什么？

**答案：**

- **`HostRoot` Fiber 的 `stateNode`**：指向 **`FiberRootNode`**。
- **`FiberRootNode`**：持有 **`container`**（DOM 容器）和 **`current`**（指向根 Fiber）等。**根 Fiber 通过 `stateNode` 找到整棵应用的根数据结构**。

---

### Q19：`updateContainer` 里，根上首屏 `creatUpdate` 的 `action` 类型是什么？

**答案：**

- **`ReactElementType | null`**，即 **`render` 传入的 element**（首屏即那棵要渲染的树）。

---

### Q20：`updateHostRoot` 里，`processUpdateQueue` 之后 `memorizedState` 是什么？如何传给子协调？

**答案：**

- **`memorizedState`**：即 **处理更新后的「根状态」**，首屏为 **ReactElement**。
- **`const nextChildren = workInProgress.memorizedState`**，再 **`reconcileChildren(workInProgress, nextChildren)`**，把 **element 转成子 Fiber 树**。

---

### Q21：`performUnitOfWork`：`beginWork` 返回非空 vs 空，下一步分别是什么？

**答案：**

- **非空**：**`workInProgress = next`**，继续处理 **子节点**。
- **空**：调用 **`completeUnitOfWork(fiber)`**，进入 **complete + 兄弟/父回溯**。

---

### Q22：`completeUnitOfWork` 何时令 `workInProgress = sibling`，何时沿 `return` 上升？

**答案：**

- **`completeWork(node)` 之后**：若 **`node.sibling !== null`**，**`workInProgress = sibling`**，**return**（先处理 **右兄弟**）。
- 若无兄弟：**`node = node.return`**，**`workInProgress = node`**，继续 **向上**；直到 **`node === null`** 结束本轮。

---

### Q23：`HostComponent` 的 `completeWork` 里，`createInstance` 与 `appendAllChildren` 的顺序语义？

**答案：**

- **先 `createInstance`** 得到 **空的父宿主元素**，再 **`appendAllChildren`** 把 **子树已生成好的 DOM**（子 Fiber 的 `stateNode`）**接到该父元素上**，最后 **`workInProgress.stateNode = instance`**。

---

### Q24：`commitRoot` 里 `finishedWork` 从哪里来？`root.current` 在哪赋值？

**答案：**

- **`finishedWork`**：在 **`renderRoot` / workLoop 结束后** 赋给 **`root.finishedWork`**（具体赋值以 `workLoop.ts` 为准，常见为 **本次完成的根 Fiber**）。
- **`root.current`**：在 **`commitRoot`** 内，**Mutation 之后或无副作用分支**，**`root.current = finishedWork`**。

---

### Q25：什么条件下会执行 `commitPlacement`？`getHostParent` 何时回到 `FiberRootNode.container`？

**答案：**

- **`commitMutationEffectOnFiber`** 里若 **`fiber.flags` 含 `Placement`**，则调用 **`commitPlacement`**。
- **`getHostParent`**：沿 **`fiber.return`** 向上找，遇到 **`HostComponent`** 则返回其 **`stateNode`**；遇到 **`HostRoot`** 则返回 **`(stateNode as FiberRootNode).container`**，即 **页面上的容器 DOM（如 `#root`）**。

---

## 第八部分：一句话收束

### Q26：只用一句话概括首屏渲染的本质？

**答案：**

**把一次 `render` 的 ReactElement 经更新队列变成根的状态，再经 DFS 的 `beginWork`/`completeWork` 变成 Fiber 与宿主节点，最后经 `commitRoot` 把需提交的副作用落到宿主树并切换 `root.current`。**
