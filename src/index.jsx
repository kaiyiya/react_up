import React from 'react';
import { createRoot } from "react-dom/client";
import LifeCycleFunction from './up/lifecycle/LifeCycleFunction';
import FItem from './up/lifecycle/FItem';
const root = createRoot(document.getElementById("root"));
root.render(<FItem />);
