import React from "react";
import ReactDOM from "react-dom/client";
import Root from "./Root"; // ← pas App
import "./index.css";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<Root />);
