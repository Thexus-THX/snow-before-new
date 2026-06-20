import { createBrowserRouter, Navigate } from "react-router-dom";
import TitlePage from "@/pages/TitlePage";
import GamePage from "@/pages/GamePage";
import EditorPage from "@/pages/EditorPage";
import SettingsPage from "@/pages/SettingsPage";
import EndingGalleryPage from "@/pages/EndingGalleryPage";

/**
 * 固定路由结构：
 *   /              标题页与玩家端入口
 *   /game          游戏运行器
 *   /editor        可视化编辑器
 *   /settings      设置页面
 *   /ending-gallery 结局图鉴
 */
export const router = createBrowserRouter([
  {
    path: "/",
    element: <TitlePage />,
  },
  {
    path: "/game",
    element: <GamePage />,
  },
  {
    path: "/editor",
    element: <EditorPage />,
  },
  {
    path: "/settings",
    element: <SettingsPage />,
  },
  {
    path: "/ending-gallery",
    element: <EndingGalleryPage />,
  },
  // 未知路由回退到标题页
  {
    path: "*",
    element: <Navigate to="/" replace />,
  },
]);
