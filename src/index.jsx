import React from 'react';
import { createRoot } from "react-dom/client";
import ForwardRefIndex from './up/ref/RefCombine';
import HOC from './up/ref/HOC';
import Father from './up/ref/Ref';
import Index from './up/ref/RefSon';
import IndexR from './up/ref/RefNew';

const root = createRoot(document.getElementById("root"));
root.render(<IndexR />);
