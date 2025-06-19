import React from 'react';
import { createRoot } from "react-dom/client";
import Provider1Demo from './up/provider/Demo4';
import DemoProvider5 from './up/provider/Demo5';
const root = createRoot(document.getElementById("root"));
root.render(<DemoProvider5 />);
