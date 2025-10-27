import React from 'react';
import { createRoot } from "react-dom/client";
import Render2, { Render2Index } from './up/render/Render2';
import Render3 from './up/render/Render3';
const root = createRoot(document.getElementById("root"));
root.render(<Render3 />);
