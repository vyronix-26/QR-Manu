import { createBrowserRouter, RouterProvider } from "react-router";
import { ScanPage } from "./pages/ScanPage";
import { MenuPage } from "./pages/MenuPage";
import { CartPage } from "./pages/CartPage";
import { BillPage } from "./pages/BillPage";
import { RatingPage } from "./pages/RatingPage";
import { TableSelection } from "./pages/TableSelection";
import { ServiceDashboard } from "./pages/ServiceDashboard";
import { Toaster } from "./components/ui/sonner";

// 1. تعريف مسارات التطبيق (Router)
const router = createBrowserRouter([
  {
    // عند فتح الموقع لأول مرة، تظهر صفحة الـ QR الفخمة مباشرة
    path: "/",
    element: <ScanPage />,
  },
  {
    // صفحة الـ QR مع رقم الطاولة
    path: "/scan/:tableNumber",
    element: <ScanPage />,
  },
  {
    // صفحة المنيو (لا تفتح إلا برقم طاولة)
    path: "/table/:tableNumber",
    element: <MenuPage />,
  },
  {
    // صفحة السلة
    path: "/cart/:tableNumber",
    element: <CartPage />,
  },
  {
    // صفحة الفاتورة
    path: "/bill/:tableNumber",
    element: <BillPage />,
  },
  {
    // صفحة التقييم
    path: "/rating/:tableNumber",
    element: <RatingPage />,
  },
  {
    // صفحة تحديد الطاولات يدوياً
    path: "/select",
    element: <TableSelection />,
  },
  {
    // لوحة تحكم الخدمة للمطعم
    path: "/service",
    element: <ServiceDashboard />,
  },
  {
    // إعادة توجيه أي مسار خاطئ إلى صفحة الـ QR الرئيسية
    path: "*",
    element: <ScanPage />,
  }
]);

// 2. المكون الرئيسي للتطبيق الذي سيتم تصديره لملف main.tsx
export function App() {
  return (
    <>
      <RouterProvider router={router} />
      <Toaster />
    </>
  );
}