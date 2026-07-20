import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Separator } from "../components/ui/separator";
import {
  ChefHat, Clock, CheckCircle, UtensilsCrossed, AlertTriangle,
  X, TrendingUp, ShoppingBag, XCircle, Star, BarChart3,
} from "lucide-react";
import { getOrders, updateItemStatus, getAnalytics, getRatings } from "../utils/orderStorage";
import { Order, AnalyticsData, RatingRecord } from "../types/menu";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";

const SIX_MINUTES = 6 * 60 * 1000;

interface OverdueAlert {
  tableNumber: string;
  itemName: string;
  itemId: string;
  waitMinutes: number;
  status: string;
}

export function ServiceDashboard() {
  const [orders, setOrders] = useState<Record<string, Order>>({});
  const [filter, setFilter] = useState<"all" | "pending" | "cooking" | "delivered">("all");
  const [overdueAlerts, setOverdueAlerts] = useState<OverdueAlert[]>([]);
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [analytics, setAnalytics] = useState<AnalyticsData>({ completedOrders: [], cancelledItems: [] });
  const [ratings, setRatings] = useState<RatingRecord[]>([]);

  // دالة جلب الطلبات بالإضافة إلى الحجوزات المحلية المخزنة
  // تأكد أنك تقوم بجلب الحجوزات من localStorage في دالة refreshOrders
const refreshOrders = () => {
  const serverOrders = getOrders();

  const allOrders: Record<string, Order> = {
    ...serverOrders,
  };

  const reservations = JSON.parse(
    localStorage.getItem("dashboard_reservations") || "[]"
  );

  reservations.forEach((res: any) => {
    if (
      res.status !== "delivered" &&
      res.status !== "cancelled"
    ) {
      allOrders[`table-reservation-${res.id}`] = {
        tableNumber: `حجز: ${res.name}`,
        status: "active",
        timestamp: res.timestamp,

        items: [
          {
            id: res.id,
            name: `حجز طاولة (${res.guests} أشخاص)`,
            quantity: 1,
            price: 0,
            status: res.status || "pending",
            orderedAt: res.timestamp,
          },
        ],
      };
    }
  });

  setOrders(allOrders);
};

  const checkOverdue = (currentOrders: Record<string, Order>) => {
    const alerts: OverdueAlert[] = [];
    const now = Date.now();
    Object.values(currentOrders).forEach(order => {
      if (order.status !== "active") return;
      order.items.forEach(item => {
        if (item.status === "delivered" || item.status === "cancelled") return;
        const orderedAt = item.orderedAt || order.timestamp;
        const waited = now - orderedAt;
        if (waited > SIX_MINUTES) {
          alerts.push({
            tableNumber: order.tableNumber,
            itemName: item.name,
            itemId: item.id,
            waitMinutes: Math.floor(waited / 60000),
            status: item.status || "pending",
          });
        }
      });
    });
    setOverdueAlerts(alerts);
    if (alerts.length > 0) setShowAlertModal(true);
  };

  const refreshAnalytics = () => {
    const currentAnalytics = getAnalytics();
    
    if (!currentAnalytics.completedOrders || currentAnalytics.completedOrders.length === 0) {
      const activeOrders = getOrders();
      const mockCompleted: any[] = [];
      
      Object.entries(activeOrders).forEach(([tableKey, order]) => {
        const deliveredItems = order.items.filter(i => i.status === "delivered");
        if (deliveredItems.length > 0) {
          mockCompleted.push({
            id: tableKey,
            tableNumber: order.tableNumber,
            revenue: deliveredItems.reduce((sum, item) => sum + (item.price * item.quantity), 0),
            items: deliveredItems,
            completedAt: Date.now()
          });
        }
      });
      
      if (mockCompleted.length > 0) {
        setAnalytics({
          completedOrders: mockCompleted,
          cancelledItems: currentAnalytics.cancelledItems || []
        });
        setRatings(getRatings());
        return;
      }
    }
    
    setAnalytics(currentAnalytics);
    setRatings(getRatings());
  };

useEffect(() => {
  refreshOrders();

  const handleStorageChange = (event: StorageEvent) => {
    if (event.key === "dashboard_reservations") {
      refreshOrders();
    }
  };

  window.addEventListener(
    "storage",
    handleStorageChange
  );

  return () => {
    window.removeEventListener(
      "storage",
      handleStorageChange
    );
  };
}, []);

  const handleStatusChange = (tableNumber: string, itemId: string, status: "pending" | "cooking" | "delivered") => {
    // تم تعديل الشرط هنا ليطابق صيغة "حجز:" المستخدمة في لوحة التحكم
    if (tableNumber.startsWith("حجز:")) {
      const localReservations = JSON.parse(localStorage.getItem("dashboard_reservations") || "[]");
      const updated = localReservations.map((res: any) => 
        res.id === itemId ? { ...res, status: status } : res
      );
      localStorage.setItem("dashboard_reservations", JSON.stringify(updated));
      refreshOrders();
    } else {
      updateItemStatus(tableNumber, itemId, status);
      refreshOrders();
      setTimeout(() => {
        refreshAnalytics();
      }, 100);
    }
  };

  const activeOrders = Object.values(orders).filter(order => order.status === "active");

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "pending": return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
      case "cooking": return "bg-[#ff4500]/10 text-[#ff4500] border-[#ff4500]/20";
      case "delivered": return "bg-green-500/10 text-green-500 border-green-500/20";
      default: return "bg-neutral-800 text-neutral-400 border-neutral-700";
    }
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case "pending": return <Clock className="w-4 h-4" />;
      case "cooking": return <ChefHat className="w-4 h-4" />;
      case "delivered": return <CheckCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusLabel = (status?: string) => {
    switch (status) {
      case "pending": return "قيد الانتظار";
      case "cooking": return "قيد التحضير";
      case "delivered": return "مقدم";
      default: return "قيد الانتظار";
    }
  };

  const filteredOrders = activeOrders.map(order => ({
    ...order,
    items: filter === "all" ? order.items : order.items.filter(item => item.status === filter),
  })).filter(order => order.items.length > 0);

  // حسابات وإحصائيات التحليلات
  const completedOrdersList = analytics.completedOrders || [];
  const totalRevenue = completedOrdersList.reduce((s, o) => s + (o.revenue || 0), 0);
  const totalOrders = completedOrdersList.length;
  const totalItemsOrdered = completedOrdersList.reduce((s, o) => s + (o.items ? o.items.reduce((si, i) => si + i.quantity, 0) : 0), 0);
  const totalCancellations = analytics.cancelledItems ? analytics.cancelledItems.length : 0;
  const cancelledRevenueLost = analytics.cancelledItems ? analytics.cancelledItems.reduce((s, c) => s + (c.itemPrice * c.quantity), 0) : 0;
  const avgRating = ratings.length > 0
    ? (ratings.reduce((s: number, r: RatingRecord) => s + r.rating, 0) / ratings.length).toFixed(1)
    : "غير متوفر";

  const ratingDistribution = [1, 2, 3, 4, 5].map(star => ({
    name: `${star}★`,
    count: ratings.filter((r: RatingRecord) => r.rating === star).length,
  }));

  const topItems: Record<string, number> = {};
  completedOrdersList.forEach(o => {
    if (o.items) {
      o.items.forEach(i => {
        topItems[i.name] = (topItems[i.name] || 0) + i.quantity;
      });
    }
  });
  const topItemsData = Object.entries(topItems)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8)
    .map(([name, count]) => ({ name, count }));

  const CHART_COLORS = ["#ff4500", "#ff6320", "#ff8140", "#ffa060", "#3f3f46"];

  return (
    <div className="min-h-screen bg-black text-white" dir="rtl">

      {/* 6-Minute Overdue Alert Modal */}
      {showAlertModal && overdueAlerts.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="bg-neutral-950 border border-red-500/30 rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
            <div className="bg-red-950/80 border-b border-red-500/20 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-6 h-6 text-red-500" />
                <div>
                  <p className="text-red-500 font-bold text-lg">تنبيه المطبخ!</p>
                  <p className="text-red-300/70 text-sm">{overdueAlerts.length} عنصر متأخر (6 دقائق)</p>
                </div>
              </div>
              <button onClick={() => setShowAlertModal(false)} className="text-neutral-400 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 space-y-3 max-h-72 overflow-y-auto bg-neutral-950">
              {overdueAlerts.map((alert, idx) => (
                <div key={idx} className="flex items-center justify-between bg-red-950/20 border border-red-950 rounded-xl px-4 py-3">
                  <div>
                    <p className="font-semibold text-white">{alert.itemName}</p>
                    <p className="text-sm text-neutral-400">طاولة {alert.tableNumber} • {getStatusLabel(alert.status)}</p>
                  </div>
                  <Badge className="bg-red-600 text-white border-0 rounded-lg">
                    {alert.waitMinutes} دقيقة
                  </Badge>
                </div>
              ))}
            </div>
            <div className="px-6 pb-6 bg-neutral-950">
              <Button onClick={() => setShowAlertModal(false)} className="w-full bg-red-600 hover:bg-red-700 text-white rounded-xl">
                تم الاستلام — جاري العمل عليه!
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-neutral-950/80 backdrop-blur-md border-b border-white/[0.08] sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <UtensilsCrossed className="w-8 h-8 text-[#ff4500]" />
              <div>
                <h1 className="text-2xl font-bold text-white">مطعم هاوس — لوحة الخدمة</h1>
                <p className="text-sm text-neutral-400">فريق المطبخ والخدمة</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {overdueAlerts.length > 0 && (
                <button
                  onClick={() => setShowAlertModal(true)}
                  className="relative flex items-center gap-2 bg-red-600/20 border border-red-500/30 text-red-500 px-4 py-2 rounded-xl hover:bg-red-600 hover:text-white transition-all"
                >
                  <AlertTriangle className="w-4 h-4 animate-pulse" />
                  <span className="font-semibold">{overdueAlerts.length} متأخر</span>
                </button>
              )}
              <Badge className="bg-[#ff4500]/10 border border-[#ff4500]/20 text-[#ff4500] text-sm px-4 py-2 rounded-xl">
                {activeOrders.length} طاولة نشطة
              </Badge>
              <Button onClick={() => { refreshOrders(); refreshAnalytics(); }} variant="outline" className="border-white/[0.08] text-neutral-300 hover:bg-neutral-900 rounded-xl">
                تحديث
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Tabs */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <Tabs defaultValue="kitchen">
          <TabsList className="grid w-full grid-cols-2 bg-neutral-950 border border-white/[0.15] p-1.5 mb-6 rounded-2xl shadow-2xl">
            <TabsTrigger 
              value="kitchen" 
              className="flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition-all data-[state=inactive]:text-neutral-400 data-[state=inactive]:hover:text-white data-[state=active]:bg-[#ff4500] data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-[#ff4500]/20"
            >
              <ChefHat className="w-4 h-4" />
              طلبات المطبخ
            </TabsTrigger>
            <TabsTrigger 
              value="analytics" 
              className="flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition-all data-[state=inactive]:text-neutral-400 data-[state=inactive]:hover:text-white data-[state=active]:bg-[#ff4500] data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-[#ff4500]/20"
            >
              <BarChart3 className="w-4 h-4" />
              التحليلات
            </TabsTrigger>
          </TabsList>

          {/* Kitchen Orders Tab */}
          <TabsContent value="kitchen">
            <Tabs value={filter} onValueChange={(v) => setFilter(v as any)} className="mb-6">
              <TabsList className="grid w-full grid-cols-4 bg-neutral-950 border border-white/[0.1] p-1 rounded-xl shadow-lg">
                <TabsTrigger value="all" className="rounded-lg text-xs sm:text-sm py-2">جميع الطلبات</TabsTrigger>
                <TabsTrigger value="pending" className="rounded-lg text-xs sm:text-sm py-2">قيد الانتظار</TabsTrigger>
                <TabsTrigger value="cooking" className="rounded-lg text-xs sm:text-sm py-2">قيد التحضير</TabsTrigger>
                <TabsTrigger value="delivered" className="rounded-lg text-xs sm:text-sm py-2">مقدم</TabsTrigger>
              </TabsList>
            </Tabs>

            {filteredOrders.length === 0 ? (
              <div className="text-center py-20 bg-neutral-950/40 rounded-3xl border border-white/[0.05]">
                <UtensilsCrossed className="w-16 h-16 text-neutral-700 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-neutral-400 mb-2">لا توجد طلبات</h3>
                <p className="text-neutral-500 text-sm">لا توجد طلبات لـ {filter === "all" ? "الوقت الحالي" : getStatusLabel(filter)}</p>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3" dir="rtl">
                {filteredOrders.map((order) => {
                  const hasOverdue = order.items.some(item => {
                    if (item.status === "delivered") return false;
                    const orderedAt = item.orderedAt || order.timestamp;
                    return Date.now() - orderedAt > SIX_MINUTES;
                  });

                  return (
                    <Card key={order.tableNumber} className={`bg-neutral-950/90 border transition-all duration-300 rounded-3xl shadow-xl overflow-hidden ${hasOverdue ? "border-red-500/40 shadow-red-950/10" : "border-white/[0.08]"}`}>
                      <CardHeader className={`${hasOverdue ? "bg-red-950/20 border-b border-red-500/10" : "bg-gradient-to-l from-neutral-900 to-neutral-950 border-b border-white/[0.05]"}`}>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-xl flex items-center gap-2 text-white">
                            {order.tableNumber}
                            {hasOverdue && <AlertTriangle className="w-5 h-5 text-red-500 animate-pulse" />}
                          </CardTitle>
                          <Badge variant="outline" className="text-xs text-neutral-400 border-white/[0.1] rounded-lg">
                            {new Date(order.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-6">
                        <div className="space-y-4">
                          {order.items.map((item) => {
                            const orderedAt = item.orderedAt || order.timestamp;
                            const waitMs = Date.now() - orderedAt;
                            const isItemOverdue = waitMs > SIX_MINUTES && item.status !== "delivered";
                            const waitMin = Math.floor(waitMs / 60000);
                            return (
                              <div key={item.id} className={`border rounded-2xl p-3 space-y-3 transition-colors ${isItemOverdue ? "border-red-500/30 bg-red-950/10" : "border-white/[0.06] bg-neutral-900/30"}`}>
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <p className="font-semibold text-white">{item.name}</p>
                                    <div className="flex items-center gap-2 text-xs text-neutral-400 mt-1">
                                      <span>الكمية: {item.quantity}</span>
                                      <span>•</span>
                                      <span className={isItemOverdue ? "text-red-400 font-medium" : "text-neutral-500"}>{waitMin} دقيقة مضت</span>
                                    </div>
                                  </div>
                                  <Badge className={`${getStatusColor(item.status)} border rounded-lg text-xs font-normal`}>
                                    <span className="flex items-center gap-1">
                                      {getStatusIcon(item.status)}
                                      {getStatusLabel(item.status)}
                                    </span>
                                  </Badge>
                                </div>

                                <div className="flex gap-1.5 pt-1">
                                  <Button size="sm" variant={item.status === "pending" ? "default" : "outline"} className={`flex-1 text-xs rounded-xl h-8 ${item.status === "pending" ? "bg-yellow-600 hover:bg-yellow-700 text-white" : "border-white/[0.06] text-neutral-400 hover:bg-neutral-800"}`}
                                    onClick={() => handleStatusChange(order.tableNumber, item.id, "pending")}
                                  >
                                    انتظار
                                  </Button>
                                  <Button size="sm" variant={item.status === "cooking" ? "default" : "outline"} className={`flex-1 text-xs rounded-xl h-8 ${item.status === "cooking" ? "bg-[#ff4500] hover:bg-[#ff4500]/90 text-white" : "border-white/[0.06] text-neutral-400 hover:bg-neutral-800"}`}
                                    onClick={() => handleStatusChange(order.tableNumber, item.id, "cooking")}
                                  >
                                    تحضير
                                  </Button>
                                  <Button size="sm" variant={item.status === "delivered" ? "default" : "outline"} className={`flex-1 text-xs rounded-xl h-8 ${item.status === "delivered" ? "bg-green-600 hover:bg-green-700 text-white" : "border-white/[0.06] text-neutral-400 hover:bg-neutral-800"}`}
                                    onClick={() => handleStatusChange(order.tableNumber, item.id, "delivered")}
                                  >
                                    تسيير
                                  </Button>
                                </div>
                              </div>
                            );
                          })}

                          {order.cancelledItems && order.cancelledItems.length > 0 && (
                            <div className="pt-3 border-t border-dashed border-white/[0.08]">
                              <p className="text-xs font-medium text-red-400/80 mb-1">أُلغي من قِبل الزبون:</p>
                              {order.cancelledItems.map((ci, idx) => (
                                <p key={idx} className="text-xs text-neutral-500 line-through">{ci.name} ×{ci.quantity}</p>
                              ))}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="bg-neutral-950/90 border border-white/[0.08] text-white rounded-2xl shadow-xl overflow-hidden">
                  <CardContent className="pt-6 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#ff4500]/10 flex items-center justify-center text-[#ff4500] font-bold text-lg border border-[#ff4500]/20">
                        ₪
                      </div>
                      <div>
                        <p className="text-xs text-neutral-400">إجمالي الإيرادات</p>
                        <p className="text-xl font-bold text-white">₪{totalRevenue.toFixed(0)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-neutral-950/90 border border-white/[0.08] text-white rounded-2xl shadow-xl overflow-hidden">
                  <CardContent className="pt-6 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center justify-center">
                        <ShoppingBag className="w-5 h-5 text-blue-400" />
                      </div>
                      <div>
                        <p className="text-xs text-neutral-400">إجمالي الطلبات</p>
                        <p className="text-xl font-bold text-white">{totalOrders}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-neutral-950/90 border border-white/[0.08] text-white rounded-2xl shadow-xl overflow-hidden">
                  <CardContent className="pt-6 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center justify-center">
                        <XCircle className="w-5 h-5 text-red-400" />
                      </div>
                      <div>
                        <p className="text-xs text-neutral-400">أصناف ملغاة</p>
                        <p className="text-xl font-bold text-white">{totalCancellations}</p>
                        <p className="text-xs text-red-400">₪{cancelledRevenueLost.toFixed(0)} خسارة</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-neutral-950/90 border border-white/[0.08] text-white rounded-2xl shadow-xl overflow-hidden">
                  <CardContent className="pt-6 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-yellow-500/10 border border-yellow-500/20 rounded-xl flex items-center justify-center">
                        <Star className="w-5 h-5 text-yellow-400 fill-yellow-400/20" />
                      </div>
                      <div>
                        <p className="text-xs text-neutral-400">متوسط التقييم</p>
                        <p className="text-xl font-bold text-white">{avgRating}</p>
                        <p className="text-xs text-neutral-500">{ratings.length} تقييم</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Top Items Chart */}
                <Card className="bg-neutral-950/90 border border-white/[0.08] text-white rounded-2xl shadow-xl overflow-hidden">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-white text-lg">
                      <TrendingUp className="w-5 h-5 text-[#ff4500]" />
                      أكثر الأصناف طلباً
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {topItemsData.length === 0 ? (
                      <p className="text-neutral-600 text-center py-12 text-sm">لا توجد بيانات بعد</p>
                    ) : (
                      <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={topItemsData} layout="vertical" margin={{ left: 10, right: 10 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                          <XAxis type="number" stroke="#737373" fontSize={11} />
                          <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 11, fill: '#d4d4d4' }} stroke="#737373" />
                          <Tooltip contentStyle={{ backgroundColor: '#0a0a0a', borderColor: '#262626', color: '#fff', borderRadius: '12px' }} />
                          <Bar dataKey="count" fill="#ff4500" radius={[0, 4, 4, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>

                {/* Ratings Chart */}
                <Card className="bg-neutral-950/90 border border-white/[0.08] text-white rounded-2xl shadow-xl overflow-hidden">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-white text-lg">
                      <Star className="w-5 h-5 text-yellow-500 fill-yellow-500/10" />
                      توزيع التقييمات
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {ratings.length === 0 ? (
                      <p className="text-neutral-600 text-center py-12 text-sm">لا توجد تقييمات بعد</p>
                    ) : (
                      <ResponsiveContainer width="100%" height={220}>
                        <PieChart>
                          <Pie
                            data={ratingDistribution.filter(d => d.count > 0)}
                            dataKey="count"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            outerRadius={75}
                            label={({ name, count }) => `${name}: ${count}`}
                            labelLine={{ stroke: '#404040' }}
                          >
                            {ratingDistribution.map((_, idx) => (
                              <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip contentStyle={{ backgroundColor: '#0a0a0a', borderColor: '#262626', color: '#fff', borderRadius: '12px' }} />
                          <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Cancellation Details */}
              {analytics.cancelledItems && analytics.cancelledItems.length > 0 && (
                <Card className="bg-neutral-950/90 border border-white/[0.08] text-white rounded-2xl shadow-xl overflow-hidden">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-white text-lg">
                      <XCircle className="w-5 h-5 text-red-500" />
                      سجل الإلغاء
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-0">
                      <div className="grid grid-cols-4 text-xs font-semibold text-neutral-500 pb-2 border-b border-white/[0.08]">
                        <span>الصنف</span>
                        <span className="text-center">الطاولة</span>
                        <span className="text-center">الكمية</span>
                        <span className="text-right">الوقت</span>
                      </div>
                      {analytics.cancelledItems.slice().reverse().slice(0, 15).map((c, idx) => (
                        <div key={idx} className="grid grid-cols-4 text-sm py-2.5 border-b border-white/[0.05] last:border-0 text-neutral-300">
                          <span className="font-medium text-white">{c.itemName}</span>
                          <span className="text-center text-neutral-400">{c.tableNumber}</span>
                          <span className="text-center text-neutral-400">×{c.quantity}</span>
                          <span className="text-right text-neutral-500 text-xs">
                            {new Date(c.cancelledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Order Statistics */}
              <Card className="bg-neutral-950/90 border border-white/[0.08] text-white rounded-2xl shadow-xl overflow-hidden">
                <CardHeader>
                  <CardTitle className="text-white text-lg">إحصائيات الطلبات العامة</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div className="bg-neutral-900/50 border border-white/[0.05] rounded-xl p-4">
                      <p className="text-2xl font-bold text-[#ff4500]">{totalItemsOrdered}</p>
                      <p className="text-xs text-neutral-400 mt-1">إجمالي الأصناف المقدمة</p>
                    </div>
                    <div className="bg-neutral-900/50 border border-white/[0.05] rounded-xl p-4">
                      <p className="text-2xl font-bold text-blue-400">
                        ₪{totalOrders > 0 ? (totalRevenue / totalOrders).toFixed(0) : 0}
                      </p>
                      <p className="text-xs text-neutral-400 mt-1">متوسط قيمة الطلب</p>
                    </div>
                    <div className="bg-neutral-900/50 border border-white/[0.05] rounded-xl p-4">
                      <p className="text-2xl font-bold text-red-400">
                        {totalItemsOrdered > 0 ? ((totalCancellations / (totalItemsOrdered + totalCancellations)) * 100).toFixed(1) : 0}%
                      </p>
                      <p className="text-xs text-neutral-400 mt-1">نسبة الإلغاء العام</p>
                    </div>
                    <div className="bg-neutral-900/50 border border-white/[0.05] rounded-xl p-4">
                      <p className="text-2xl font-bold text-green-400">
                        {ratings.filter((r: RatingRecord) => r.rating >= 4).length}
                      </p>
                      <p className="text-xs text-neutral-400 mt-1">تقييمات إيجابية (4-5★)</p>
                    </div>
                  </div>

                  {/* Recent Reviews */}
                  {ratings.length > 0 && (
                    <>
                      <Separator className="my-5 bg-white/[0.08]" />
                      <p className="font-semibold text-neutral-300 mb-3 text-sm">أحدث آراء وتجارب الزبائن</p>
                      <div className="space-y-3">
                        {ratings.slice().reverse().slice(0, 5).map((r: RatingRecord, idx: number) => (
                          <div key={idx} className="flex items-start gap-3 p-3 bg-neutral-900/40 border border-white/[0.05] rounded-xl">
                            <div className="flex shrink-0 pt-0.5">
                              {[1, 2, 3, 4, 5].map(s => (
                                <Star key={s} className={`w-3.5 h-3.5 ${s <= r.rating ? "text-yellow-500 fill-yellow-500" : "text-neutral-700"}`} />
                              ))}
                            </div>
                            <div className="flex-1">
                              <p className="text-sm text-neutral-200">{r.comment || "تم التقييم بالنجوم فقط بدون تعليق مكتوب."}</p>
                              <p className="text-xs text-neutral-500 mt-1">طاولة {r.tableNumber} • {new Date(r.timestamp).toLocaleDateString('ar-EG')}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}