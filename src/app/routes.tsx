import { createBrowserRouter } from "react-router";
import { MenuPage } from "./pages/MenuPage";
import { CartPage } from "./pages/CartPage";
import { BillPage } from "./pages/BillPage";
import { TableSelection } from "./pages/TableSelection";
import { ScanPage } from "./pages/ScanPage";
import { ServiceDashboard } from "./pages/ServiceDashboard";
import { RatingPage } from "./pages/RatingPage";

export const router = createBrowserRouter([
  {
    // 1. هنا تم التعديل: تفتح صفحة الـ QR مباشرة عند الدخول للموقع
    path: "/",
    element: <ScanPage />, 
  },
  {
    path: "/select",
    element: <TableSelection />,
  },
  {
    path: "/service",
    element: <ServiceDashboard />,
  },
  {
    path: "/table/:tableNumber",
    element: <MenuPage />,
  },
  {
    path: "/cart/:tableNumber",
    element: <CartPage />,
  },
  {
    path: "/bill/:tableNumber",
    element: <BillPage />,
  },
  {
    path: "/rating/:tableNumber",
    element: <RatingPage />,
  },
  {
    // 2. مسار احتياطي لإعادة أي مستخدم يدخل رابط خاطئ إلى صفحة الـ QR
    path: "*",
    element: <ScanPage />,
  }
]);