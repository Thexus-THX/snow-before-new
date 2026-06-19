import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { router } from "@/app/router";
import "@/styles/tokens.css";
import "@/styles/global.css";
import "@/styles/special-scenes.css";

// UI Debug 模式初始化
try {
  const urlParam = new URLSearchParams(window.location.search).get("uiDebug");
  if (urlParam === "1") {
    localStorage.setItem("uiDebug", "1");
    document.documentElement.classList.add("uiDebug");
  } else if (urlParam === "0") {
    localStorage.removeItem("uiDebug");
    document.documentElement.classList.remove("uiDebug");
  } else if (localStorage.getItem("uiDebug") === "1") {
    document.documentElement.classList.add("uiDebug");
  }
} catch { /* SSR / 异常环境静默 */ }

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
