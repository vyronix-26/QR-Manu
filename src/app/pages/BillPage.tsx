import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Separator } from "../components/ui/separator";
import { Badge } from "../components/ui/badge";
import { Printer, CreditCard, Banknote, Smartphone, CheckCircle2, MapPin, Phone, Calendar, Clock, ShoppingCart } from "lucide-react";
import { CartItem } from "../types/menu";
import { getOrderByTable, completeOrder, clearOrder } from "../utils/orderStorage";

export function BillPage() {
  const { tableNumber } = useParams<{ tableNumber: string }>();
  const navigate = useNavigate();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<string | null>(null);
  const [isPaid, setIsPaid] = useState(false);
  const billRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (tableNumber) {
      const existingOrder = getOrderByTable(tableNumber);
      if (existingOrder) {
        setCart(existingOrder.items);
        completeOrder(tableNumber);
      } else {
        navigate(`/table/${tableNumber}`);
      }
    }
  }, [tableNumber, navigate]);

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const gst = subtotal * 0.05;
  const total = subtotal + gst;

  const handlePrint = () => {
    window.print();
  };

  const handlePayment = (method: string) => {
    setPaymentMethod(method);
    setTimeout(() => {
      setIsPaid(true);
      if (tableNumber) {
        clearOrder(tableNumber, total);
        setTimeout(() => {
          navigate(`/rating/${tableNumber}`);
        }, 2000);
      }
    }, 1500);
  };

  const handleNewOrder = () => {
    if (tableNumber) {
      navigate(`/table/${tableNumber}`);
    }
  };

  // 1. واجهة نجاح عملية الدفع (داكنة وفخمة)
  if (isPaid) {
    return (
      <div className="min-h-screen bg-black/75 flex items-center justify-center p-4 antialiased">
        <Card className="max-w-md w-full text-center rounded-3xl bg-neutral-950/80 backdrop-blur-md border border-emerald-500/20 shadow-[0_15px_50px_rgba(16,185,129,0.1)]">
          <CardContent className="py-12 flex flex-col items-center">
            <div className="p-4 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mb-6">
              <CheckCircle2 className="w-16 h-16 animate-bounce" />
            </div>
            <h2 className="text-3xl font-black text-white mb-2">تم الدفع بنجاح!</h2>
            <p className="text-zinc-400 text-sm mb-1">شكراً لتناولك الطعام معنا</p>
            <p className="text-xs font-bold text-orange-500 mb-8">طاولة {tableNumber} • مطعم هاوس</p>
            <div className="space-y-3 w-full">
              <Button 
                onClick={handleNewOrder} 
                className="w-full py-6 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-sm transition-all duration-300" 
                size="lg"
              >
                طلب جديد
              </Button>
              <Button 
                onClick={() => navigate("/")} 
                variant="outline" 
                className="w-full py-6 rounded-xl border-white/[0.08] bg-neutral-900 hover:bg-zinc-800 text-zinc-300 font-bold text-sm transition-all duration-300"
              >
                العودة للرئيسية
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-black/75 text-zinc-100 py-8 px-4 antialiased">
      <div className="max-w-3xl mx-auto space-y-6">
        
        {/* 2. الفاتورة الزجاجية الفخمة */}
        <Card ref={billRef} id="bill-content" className="print:shadow-none rounded-3xl bg-neutral-950/80 backdrop-blur-md border border-white/[0.08] shadow-[0_15px_45px_rgba(0,0,0,0.65)] text-right overflow-hidden">
          <CardHeader className="text-center border-b border-white/[0.06] p-8">
            <div className="space-y-1">
              <CardTitle className="text-3xl font-black text-white tracking-wide">مطعم هاوس</CardTitle>
              <p className="text-xs text-zinc-400 flex items-center justify-center gap-1.5 mt-2">
                123 شارع الرئيسي، المدينة
                <MapPin className="w-3.5 h-3.5 text-zinc-500" />
              </p>
              <p className="text-xs text-zinc-400 flex items-center justify-center gap-1.5">
                +91 1234567890 :الهاتف
                <Phone className="w-3.5 h-3.5 text-zinc-500" />
              </p>
              <p className="text-[10px] text-zinc-600 font-bold tracking-wider pt-1">GSTIN: 29ABCDE1234F1Z5</p>
            </div>
          </CardHeader>
          <CardContent className="p-8 space-y-6">
            <div className="flex justify-between items-start text-xs text-zinc-400 bg-white/[0.01] p-4 rounded-2xl border border-white/[0.04]">
              <div className="space-y-1">
                <p className="flex items-center gap-1.5 text-zinc-300 font-bold">
                  طاولة: {tableNumber}
                </p>
                <p className="flex items-center gap-1.5 justify-end mt-1 text-[11px]">
                  <span>التاريخ: {new Date().toLocaleDateString("ar-EG")}</span>
                  <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                </p>
                <p className="flex items-center gap-1.5 justify-end text-[11px]">
                  <span>الوقت: {new Date().toLocaleTimeString("ar-EG", { hour: '2-digit', minute: '2-digit' })}</span>
                  <Clock className="w-3.5 h-3.5 text-zinc-500" />
                </p>
              </div>
              <div>
                <Badge className="bg-orange-500/10 border border-orange-500/20 text-orange-400 font-bold text-xs px-2.5 py-0.5 rounded-md">
                  فاتورة غير مدفوعة
                </Badge>
              </div>
            </div>

            <Separator className="bg-white/[0.06]" />

            {/* جدول عناصر الفاتورة */}
            <div className="space-y-3">
              <div className="grid grid-cols-12 gap-2 font-black text-xs text-zinc-500 border-b border-white/[0.06] pb-2 text-right">
                <div className="col-span-6">الصنف</div>
                <div className="col-span-2 text-center">الكمية</div>
                <div className="col-span-2 text-left">السعر</div>
                <div className="col-span-2 text-left">المبلغ</div>
              </div>
              
              <div className="space-y-2.5">
                {cart.map((item) => (
                  <div key={item.id} className="grid grid-cols-12 gap-2 text-sm text-right items-center">
                    <div className="col-span-6 font-bold text-zinc-200">{item.name}</div>
                    <div className="col-span-2 text-center font-bold text-zinc-400">{item.quantity}</div>
                    <div className="col-span-2 text-left text-zinc-400">₪{item.price}</div>
                    <div className="col-span-2 text-left font-black text-white">₪{(item.price * item.quantity).toFixed(2)}</div>
                  </div>
                ))}
              </div>
            </div>

            <Separator className="bg-white/[0.06]" />

            {/* تفاصيل الأسعار والضريبة */}
            <div className="space-y-2 bg-white/[0.01] p-4 rounded-2xl border border-white/[0.04] text-sm">
              <div className="flex justify-between items-center flex-row-reverse">
                <span className="text-zinc-400 font-medium">المجموع الفرعي</span>
                <span className="font-bold text-zinc-200">₪{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center flex-row-reverse">
                <span className="text-zinc-400 font-medium">ضريبة القيمة المضافة (5%)</span>
                <span className="font-bold text-zinc-200">₪{gst.toFixed(2)}</span>
              </div>
              <Separator className="bg-white/[0.04] my-2" />
              <div className="flex justify-between items-center flex-row-reverse">
                <span className="text-lg font-black text-white">الإجمالي الكلي</span>
                <span className="text-2xl font-black text-orange-500">₪{total.toFixed(2)}</span>
              </div>
            </div>

            <Separator className="bg-white/[0.06]" />

            <div className="text-center text-xs text-zinc-400 space-y-1">
              <p className="font-bold text-white">شكراً لتناول الطعام معنا!</p>
              <p>نتمنى رؤيتك مرة أخرى قريباً</p>
            </div>
          </CardContent>
        </Card>

        {/* 3. خيارات الدفع الزجاجية */}
        <Card className="rounded-3xl bg-neutral-950/80 backdrop-blur-md border border-white/[0.08] shadow-[0_12px_35px_rgba(0,0,0,0.6)] text-right">
          <CardHeader className="pb-4">
            <CardTitle className="text-md font-black text-white">اختر طريقة الدفع</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { id: "cash", label: "الدفع نقداً", icon: Banknote },
              { id: "card", label: "الدفع بالبطاقة", icon: CreditCard },
              { id: "upi", label: "الدفع عبر UPI", icon: Smartphone },
            ].map((method) => {
              const Icon = method.icon;
              return (
                <Button
                  key={method.id}
                  onClick={() => handlePayment(method.id)}
                  variant={paymentMethod === method.id ? "default" : "outline"}
                  className={`w-full justify-between py-6 rounded-xl font-bold text-xs transition-all duration-300 flex flex-row-reverse ${
                    paymentMethod === method.id
                      ? "bg-orange-600 hover:bg-orange-500 text-white border-transparent"
                      : "border-white/[0.08] bg-neutral-900 hover:bg-zinc-800 text-zinc-300"
                  }`}
                  disabled={paymentMethod !== null}
                >
                  <span className="flex items-center gap-3 flex-row-reverse">
                    <Icon className="w-5 h-5" />
                    {method.label}
                  </span>
                </Button>
              );
            })}

            {paymentMethod && !isPaid && (
              <div className="text-center text-xs text-zinc-500 pt-4 animate-pulse">
                جاري معالجة الدفع بشكل آمن...
              </div>
            )}
          </CardContent>
        </Card>

        {/* زر الطباعة السفلي */}
        <Button 
          onClick={handlePrint} 
          variant="outline" 
          className="w-full py-6 rounded-xl border-white/[0.08] bg-neutral-900 hover:bg-zinc-800 text-zinc-300 font-bold text-xs transition-all duration-300 print:hidden" 
          size="lg"
        >
          <Printer className="w-4 h-4 ml-2" />
          طباعة الفاتورة الورقية
        </Button>
      </div>

      {/* تحسينات كود الطباعة المتوافق مع الهواتف والأجهزة المختلفة */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #bill-content, #bill-content * { visibility: visible; }
          #bill-content { position: absolute; left: 0; top: 0; width: 100%; }
        }
      `}</style>
    </div>
  );
}