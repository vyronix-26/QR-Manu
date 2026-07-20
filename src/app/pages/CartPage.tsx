import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Separator } from "../components/ui/separator";
import { Badge } from "../components/ui/badge";
import { ArrowLeft, Plus, Minus, XCircle, Clock, CheckCircle, AlertTriangle, ShoppingCart, UtensilsCrossed } from "lucide-react";
import { CartItem } from "../types/menu";
import { getOrderByTable, saveOrder, cancelItem } from "../utils/orderStorage";
import { toast } from "sonner";

const CANCEL_WINDOW_MS = 4 * 60 * 1000; // 4 دقائق

function formatCountdown(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function CartPage() {
  const { tableNumber } = useParams<{ tableNumber: string }>();
  const navigate = useNavigate();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cancelledItems, setCancelledItems] = useState<CartItem[]>([]);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (tableNumber) {
      const existingOrder = getOrderByTable(tableNumber);
      if (existingOrder) {
        setCart(existingOrder.items);
        setCancelledItems(existingOrder.cancelledItems || []);
      }
    }
  }, [tableNumber]);

  // تحديث العداد كل ثانية
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (tableNumber && cart.length > 0) {
      saveOrder(tableNumber, cart);
    }
  }, [cart, tableNumber]);

  const updateQuantity = (itemId: string, change: number) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === itemId);
      if (!existing) return prev;
      const newQuantity = existing.quantity + change;
      if (newQuantity <= 0) return prev.filter((i) => i.id !== itemId);
      return prev.map((i) => (i.id === itemId ? { ...i, quantity: newQuantity } : i));
    });
  };

  const handleCancelItem = (itemId: string, itemName: string) => {
    if (!tableNumber) return;
    const success = cancelItem(tableNumber, itemId);
    if (success) {
      const cancelledItem = cart.find(i => i.id === itemId);
      if (cancelledItem) setCancelledItems(prev => [...prev, { ...cancelledItem, status: "cancelled" }]);
      setCart((prev) => prev.filter((i) => i.id !== itemId));
      toast.success(`${itemName} تم إلغاءه بنجاح`);
    } else {
      toast.error("انتهت مهلة الإلغاء (مرّت 4 دقائق)");
    }
  };

  const getRemainingCancelTime = (item: CartItem): number => {
    const orderedAt = item.orderedAt || Date.now();
    return CANCEL_WINDOW_MS - (now - orderedAt);
  };

  const canCancelItem = (item: CartItem): boolean => {
    return getRemainingCancelTime(item) > 0;
  };

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleFinishOrder = () => {
    if (tableNumber) navigate(`/bill/${tableNumber}`);
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "cooking": return "bg-orange-500/10 border border-orange-500/20 text-orange-400";
      case "delivered": return "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400";
      case "cancelled": return "bg-red-500/10 border border-red-500/20 text-red-400";
      default: return "bg-amber-500/10 border border-amber-500/20 text-amber-400";
    }
  };

  const getStatusLabel = (status?: string) => {
    switch (status) {
      case "pending": return "قيد الانتظار";
      case "cooking": return "قيد التحضير";
      case "delivered": return "مُقدّم";
      case "cancelled": return "ملغى";
      default: return "قيد الانتظار";
    }
  };

  return (
    <div className="relative min-h-screen bg-black/75 text-zinc-100 antialiased pb-24">
      
      {/* 1. هيدر متناسق وداكن */}
      <header className="sticky top-0 z-40 h-20 w-full border-b border-white/[0.06] bg-neutral-950/95 backdrop-blur-md flex items-center">
        <div className="max-w-4xl w-full mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => navigate(`/table/${tableNumber}`)}
              className="rounded-xl border border-white/[0.06] bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800"
            >
              <ArrowLeft className="w-5 h-5 h-4 w-4" />
            </Button>
            <div className="text-right">
              <h1 className="text-lg font-black bg-gradient-to-l from-white to-zinc-400 bg-clip-text text-transparent">
                تفاصيل طلبك
              </h1>
              <p className="text-[11px] font-bold text-orange-500 mt-0.5">
                طاولة {tableNumber} • مطعم هاوس
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        
        {/* 2. حالة السلة فارغة تماماً بستايل داكن فخم */}
        {cart.length === 0 && cancelledItems.length === 0 ? (
          <div className="w-full max-w-md mx-auto p-8 rounded-3xl bg-neutral-950/80 backdrop-blur-md border border-white/[0.08] text-center shadow-[0_12px_40px_rgba(0,0,0,0.8)] flex flex-col items-center gap-5">
            <div className="p-4 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-500">
              <ShoppingCart className="w-8 h-8 animate-pulse" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white mb-2">السلة فارغة</h2>
              <p className="text-sm text-zinc-400">لم تقم بإضافة أي وجبات أو أصناف بعد.</p>
            </div>
            <Button
              onClick={() => navigate(`/table/${tableNumber}`)}
              className="w-full py-6 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-sm transition-all duration-300 active:scale-95 shadow-lg shadow-orange-600/15"
            >
              تصفح قائمة الطعام
            </Button>
          </div>
        ) : (
          
          /* 3. هيكل السلة عند وجود أصناف */
          <div className="grid gap-6 lg:grid-cols-3 items-start">
            
            {/* القائمة اليمنى: عناصر الطلب الحالية والملغاة */}
            <div className="lg:col-span-2 space-y-5">
              {cart.length > 0 && (
                <Card className="rounded-3xl bg-neutral-950/80 backdrop-blur-md border border-white/[0.08] shadow-[0_12px_35px_rgba(0,0,0,0.6)] p-6">
                  <CardHeader className="p-0 mb-5 text-right">
                    <CardTitle className="text-lg font-black text-white">عناصر الطلب</CardTitle>
                    <CardDescription className="text-xs text-zinc-400 mt-1">
                      {cart.length} أصناف جاهزة أو تم إرسالها للتحضير
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="p-0 space-y-4">
                    {cart.map((item) => {
                      const cancellable = canCancelItem(item);
                      const remaining = getRemainingCancelTime(item);
                      return (
                        <div key={item.id} className="border border-white/[0.05] rounded-2xl p-4 bg-white/[0.01] space-y-3">
                          <div className="flex items-start justify-between gap-4">
                            
                            {/* أزرار التحكم بالكمية */}
                            <div className="flex items-center gap-1.5 bg-neutral-900 p-1 rounded-xl border border-white/[0.05]">
                              <Button size="sm" variant="ghost" className="h-8 w-8 p-0 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5" onClick={() => updateQuantity(item.id, -1)}>
                                <Minus className="w-3.5 h-3.5" />
                              </Button>
                              <span className="w-6 text-center font-bold text-sm text-white">{item.quantity}</span>
                              <Button size="sm" variant="ghost" className="h-8 w-8 p-0 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5" onClick={() => updateQuantity(item.id, 1)}>
                                <Plus className="w-3.5 h-3.5" />
                              </Button>
                            </div>

                            {/* التفاصيل والنصوص */}
                            <div className="flex-1 text-right flex flex-col gap-1">
                              <div className="flex flex-row-reverse items-center justify-start gap-2">
                                <p className="font-bold text-white text-md">{item.name}</p>
                                <Badge className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${getStatusColor(item.status)}`}>
                                  {getStatusLabel(item.status)}
                                </Badge>
                              </div>
                              <p className="text-xs font-semibold text-zinc-400">
                                ₪{item.price} × {item.quantity} = <span className="text-orange-400 font-bold">₪{item.price * item.quantity}</span>
                              </p>
                              
                              {/* عرض ملاحظة الصنف بطريقة فخمة متناسقة */}
                              {item.note && (
                                <div className="text-[11px] text-orange-400 bg-orange-500/5 px-2.5 py-1.5 rounded-xl mt-2 border border-orange-500/10 font-medium inline-block text-right w-max ml-auto">
                                  ✍️ ملاحظة: {item.note}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* خيار وقت وسياسة الإلغاء ناعمة في الأسفل */}
                          {cancellable ? (
                            <div className="flex items-center justify-between pt-2.5 border-t border-dashed border-white/[0.05]">
                              <div className="flex items-center gap-1 text-[11px] font-semibold text-amber-500/90">
                                <Clock className="w-3.5 h-3.5" />
                                <span>متاح الإلغاء خلال {formatCountdown(remaining)}</span>
                              </div>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-red-400 hover:text-red-300 hover:bg-red-500/10 h-7 text-xs font-bold rounded-lg px-2.5"
                                onClick={() => handleCancelItem(item.id, item.name)}
                              >
                                <XCircle className="w-3.5 h-3.5 ml-1" />
                                إلغاء الصنف
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-end gap-1 pt-2 border-t border-dashed border-white/[0.04] text-[11px] font-medium text-zinc-500">
                              <span>قفل التعديل والملاحظات</span>
                              <AlertTriangle className="w-3.5 h-3.5 text-zinc-600" />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              )}

              {/* قسم الأصناف الملغاة إذا كانت متوفرة */}
              {cancelledItems.length > 0 && (
                <Card className="rounded-3xl border-red-500/20 bg-red-950/20 backdrop-blur-md p-6">
                  <CardHeader className="p-0 mb-3 text-right">
                    <CardTitle className="text-red-400 font-black text-base">أصناف تم إلغاؤها</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0 space-y-2">
                    {cancelledItems.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center py-2 border-b border-white/[0.04] last:border-0 text-sm">
                        <Badge variant="outline" className="text-red-400 border-red-500/30 bg-red-500/5 text-xs font-bold">ملغى</Badge>
                        <div className="text-right">
                          <span className="font-bold line-through text-zinc-500">{item.name}</span>
                          <span className="mr-2 text-xs font-bold text-zinc-600">×{item.quantity}</span>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>

            {/* القائمة اليسرى: ملخص مالي فخم ومثبت */}
            <div className="lg:col-span-1">
              <Card className="sticky top-24 rounded-3xl bg-neutral-950/80 backdrop-blur-md border border-white/[0.08] shadow-[0_12px_35px_rgba(0,0,0,0.6)] p-6">
                <CardHeader className="p-0 mb-4 text-right">
                  <CardTitle className="text-md font-black text-white">ملخص الحساب</CardTitle>
                </CardHeader>
                
                <CardContent className="p-0 space-y-5">
                  <div className="space-y-3">
                    <Separator className="bg-white/[0.06]" />
                    <div className="flex justify-between items-center py-1">
                      <span className="text-xl font-black text-orange-500">₪{subtotal.toFixed(2)}</span>
                      <span className="text-sm font-bold text-zinc-400">المجموع الكلي</span>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2">
                    <Button 
                      onClick={handleFinishOrder} 
                      className="w-full py-6 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-sm transition-all duration-300 shadow-lg shadow-orange-600/15" 
                      size="lg" 
                      disabled={cart.length === 0}
                    >
                      <CheckCircle className="w-4 h-4 ml-2" />
                      إنهاء وطلب الفاتورة
                    </Button>
                    <Button 
                      onClick={() => navigate(`/table/${tableNumber}`)} 
                      variant="outline" 
                      className="w-full py-6 rounded-xl border-white/[0.08] bg-neutral-900 hover:bg-zinc-800 text-zinc-300 font-bold text-sm transition-all duration-300"
                    >
                      إضافة أصناف أخرى
                    </Button>
                  </div>

                  <div className="bg-amber-500/5 border border-amber-500/10 rounded-2xl p-3.5 text-xs text-amber-400 text-right leading-relaxed">
                    <p className="font-bold mb-1 flex flex-row-reverse items-center gap-1.5">
                      <span>سياسة الإلغاء والتحضير</span>
                    </p>
                    <p className="text-zinc-400 text-[11px] mt-1">
                      يرجى العلم بأنه يمكنك مراجعة وإلغاء أي صنف مجاناً خلال 4 دقائق فقط من طلبه، بعد ذلك يبدأ الطباخ في تحضير الوجبة فوراً.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
            
          </div>
        )}
      </div>
    </div>
  );
}