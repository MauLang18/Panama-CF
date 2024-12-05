// All components mapping with path for internal routes

import { lazy } from "react";

const Dashboard = lazy(() => import("../pages/protected/Dashboard"));
const Page404 = lazy(() => import("../pages/protected/404"));
const Blank = lazy(() => import("../pages/protected/Blank"));
const Leads = lazy(() => import("../pages/protected/Panama"));
const Varios = lazy(() => import("../pages/protected/Varios"));
const Hub = lazy(() => import("../pages/protected/Hub"));
const Movimiento = lazy(() => import("../pages/protected/Movimiento"));

const routes = [
  {
    path: "/dashboard", // the url
    component: Dashboard, // view rendered
  },
  {
    path: "/panama",
    component: Leads,
  },
  {
    path: "/varios",
    component: Varios,
  },
  {
    path: "/hub",
    component: Hub,
  },
  {
    path: "/movimiento",
    component: Movimiento,
  },
  {
    path: "/404",
    component: Page404,
  },
  {
    path: "/blank",
    component: Blank,
  },
];

export default routes;
