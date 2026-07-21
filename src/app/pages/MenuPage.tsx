import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { ShoppingCart, Plus, Minus, UtensilsCrossed } from "lucide-react";
import { menuItems } from "../data/menuData";
import { CartItem } from "../types/menu";
import { getOrderByTable, saveOrder } from "../utils/orderStorage";
import { MoreItemsDialog } from "../components/MoreItemsDialog";


export function MenuPage() {
  const { tableNumber } = useParams<{ tableNumber: string }>();
  const navigate = useNavigate();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [lastOrderTime, setLastOrderTime] = useState<number | null>(null);

 const categories = [
 { key: "special_offer", label: "عرض اليوم ⚡" },
  { key: "drinks", label: "مشروبات" },
  { key: "desserts", label: "حلويات" },
  { key: "appetizers", label: "مقبلات وسلطات" },
  { key: "main_dishes", label: "وجبات رئيسية" },
];
function OfferTimer({ targetDate }: { targetDate: string }) {
  const [timeLeft, setTimeLeft] = useState("");
  useEffect(() => {
    const timer = setInterval(() => {
      const distance = new Date(targetDate).getTime() - new Date().getTime();
      if (distance < 0) {
        clearInterval(timer);
        setTimeLeft("انتهى العرض");
      } else {
        const h = Math.floor(distance / (1000 * 60 * 60));
        const m = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const s = Math.floor((distance % (1000 * 60)) / 1000);
        setTimeLeft(`${h}h : ${m}m : ${s}s`);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [targetDate]);
  return <div className="text-2xl font-mono text-orange-400 font-bold">{timeLeft}</div>;
}
  const [selectedCategory, setSelectedCategory] = useState("main_dishes");

  // الفحص الذكي لتحديد طاولة افتراضية في حال الدخول المباشر للموقع
 useEffect(() => {
    if (!tableNumber) {
      // إذا حاول زبون الدخول للمنيو مباشرة بدون طاولة، نعيده لصفحة الـ QR
      navigate("/");
    } else {
      const existingOrder = getOrderByTable(tableNumber);
      if (existingOrder) {
        setCart(existingOrder.items);
      }
    }
  }, [tableNumber, navigate]);

  useEffect(() => {
    if (tableNumber && cart.length > 0) {
      saveOrder(tableNumber, cart);
    }
  }, [cart, tableNumber]);

  const addToCart = (item: any) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) =>
          i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      if (prev.length === 0) {
        setLastOrderTime(Date.now());
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const removeFromCart = (itemId: string) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === itemId);
      if (existing && existing.quantity > 1) {
        return prev.map((i) =>
          i.id === itemId ? { ...i, quantity: i.quantity - 1 } : i
        );
      }
      return prev.filter((i) => i.id !== itemId);
    });
  };

  const getItemQuantity = (itemId: string) => {
    return cart.find((i) => i.id === itemId)?.quantity || 0;
  };

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const filteredItems = menuItems.filter((item) => item.category === selectedCategory);

  return (
    <div className="relative min-h-screen bg-black/75 text-zinc-100 selection:bg-orange-500/30 selection:text-orange-200 antialiased pb-24">
      
      {/* 1. الهيدر */}
      <header className="sticky top-0 z-40 h-20 w-full border-b border-white/[0.06] bg-neutral-950/95 backdrop-blur-md flex items-center">
        <div className="max-w-5xl w-full mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-orange-50/10 border border-orange-500/20">
              <UtensilsCrossed className="w-5 h-5 text-orange-500" />
            </div>
            <div className="text-right">
              <h1 className="text-lg font-black bg-gradient-to-l from-white to-zinc-400 bg-clip-text text-transparent">
                مطعم هاوس
              </h1>
              <p className="text-[11px] font-bold text-orange-500 mt-0.5">
                طاولة {tableNumber || "1"}
              </p>
            </div>
          </div>
          
          <Button
            onClick={() => navigate(`/cart/${tableNumber || "1"}`)}
            className="relative h-10 px-4 rounded-xl bg-orange-600 hover:bg-orange-500 text-white transition-all font-bold text-xs shadow-lg shadow-orange-600/20 active:scale-95"
          >
            <ShoppingCart className="w-4 h-4 ml-2" />
            عرض الطلب
            {totalItems > 0 && (
              <Badge className="mr-2 bg-white text-orange-600 hover:bg-white font-black rounded-full px-1.5 py-0.5">
                {totalItems}
              </Badge>
            )}
          </Button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-full">
          
          {/* 2. شريط الأقسام المتجاوب بالكامل */}
         <div className="sticky top-20 z-30 w-full py-4 overflow-x-auto no-scrollbar">
  <TabsList className="flex gap-2 h-auto bg-neutral-950/90 backdrop-blur-xl border border-white/[0.08] p-2 rounded-2xl w-max min-w-full md:w-full md:max-w-3xl md:mx-auto shadow-[0_10px_35px_rgba(0,0,0,0.6)] justify-start md:justify-center">
    {categories.map((cat) => (
      <TabsTrigger
        key={cat.key}
        value={cat.key}
        className="shrink-0 md:flex-1 text-center px-5 md:px-8 py-2.5 md:py-3 rounded-xl text-xs md:text-sm font-bold text-zinc-400 transition-all duration-300 data-[state=active]:bg-orange-600 data-[state=active]:text-white data-[state=active]:shadow-lg"
      >
        {cat.label}
      </TabsTrigger>
    ))}
  </TabsList>
</div>

          {/* 3. شبكة المنتجات */}
          <TabsContent value={selectedCategory} className="mt-4">


            {selectedCategory === "special_offer" ? (
              // واجهة عرض اليوم الخاصة - بدون تكرار
              <div className="p-6 bg-neutral-900 border border-orange-500/20 rounded-3xl flex flex-col md:flex-row items-center gap-6 max-w-4xl mx-auto shadow-2xl" dir="rtl">
                {/* الصورة */}
                <div className="w-full md:w-1/3 min-w-[200px] h-64 rounded-2xl overflow-hidden border border-white/[0.05]">
                  <img
                    src="/img/5cb26d04-6fdb-47be-a30e-0bcf2adc6378 (1).jpg"
                    alt="عرض اليوم"
                    className="w-full h-full object-cover"
                  />
                </div>
               
                {/* النصوص والتحكم */}
                <div className="flex-1 text-right flex flex-col gap-3">
                  {/* العنوان والوصف */}
                  <div>
                    <h2 className="text-2xl font-black text-white">لمّة الشورما العربي 🌯✨</h2>
                    <p className="text-zinc-400 text-sm leading-relaxed mt-1">
                      أربع لفات شورما عربي مقرمشة، محضرة بخبز الصاج المحمص، مع البطاطس والثومية الأصلية.
                    </p>
                  </div>


                  {/* منطقة التحكم (تأخذ المساحة المتبقية) */}
                  <div className="mt-auto flex flex-col gap-3">
                    <div className="mb-2">
                      <span className="text-[10px] text-zinc-600 block mb-0.5">ينتهي العرض بعد:</span>
                      <OfferTimer targetDate="2026-07-25T23:59:59" />
                    </div>


                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-black text-orange-500">₪50.00</span>
                      {getItemQuantity("special_offer_id") === 0 ? (
                        <Button onClick={() => addToCart({ id: "special_offer_id", name: "لمّة الشورما العربي", price: 50 })} className="bg-orange-600 hover:bg-orange-500 rounded-xl px-6 py-2 font-bold text-xs">
                          <Plus className="w-4 h-4 ml-1" /> إضافة
                        </Button>
                      ) : (
                        <div className="flex items-center gap-1 bg-neutral-800 p-1 rounded-xl">
                          <Button onClick={() => removeFromCart("special_offer_id")} size="sm" className="h-7 w-7 bg-transparent"><Minus className="w-3 h-3" /></Button>
                          <span className="w-6 text-center font-bold text-sm">{getItemQuantity("special_offer_id")}</span>
                          <Button onClick={() => addToCart({ id: "special_offer_id", name: "لمّة الشورما العربي", price: 50 })} size="sm" className="h-7 w-7 bg-transparent"><Plus className="w-3 h-3" /></Button>
                        </div>
                      )}
                    </div>


                    {getItemQuantity("special_offer_id") > 0 && (
                      <input
                        type="text"
                        placeholder="ملاحظة للطلب..."
                        className="w-full px-3 py-1.5 text-[11px] border border-white/[0.05] rounded-lg bg-neutral-950 text-right text-zinc-300 placeholder-zinc-600 focus:border-orange-500 outline-none"
                        value={cart.find(i => i.id === "special_offer_id")?.note || ""}
                        onChange={(e) => {
                           setCart(prev => prev.map(i => i.id === "special_offer_id" ? {...i, note: e.target.value} : i))
                        }}
                      />
                    )}
                  </div>
                </div>
              </div>
            ) : filteredItems.length > 0 ? (
              // عرض قائمة المنتجات العادية


<div className="grid gap-6 md:grid-cols-2" dir="rtl">
                {filteredItems.map((item) => {
                  const quantity = getItemQuantity(item.id);
                  return (
                    <Card 
                      key={item.id} 
                      className="group overflow-hidden rounded-3xl bg-neutral-950/95 border border-white/[0.08] hover:border-orange-500/30 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_30px_rgba(0,0,0,0.7)] flex flex-col justify-between p-5 gap-4"
                    >
                      <CardHeader className="p-0">
                        <div className="flex flex-row-reverse items-start gap-5 justify-between w-full">
                          
                          {/* صورة المنتج */}
                          {item.image ? (
                            <div className="w-28 h-28 min-w-[112px] rounded-2xl overflow-hidden border border-white/[0.05] bg-neutral-900 relative shadow-inner">
                              <img 
                                src={item.image} 
                                alt={item.name} 
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                              />
                            </div>
                          ) : (
                            <div className="w-28 h-28 min-w-[112px] rounded-2xl bg-neutral-900 border border-white/[0.05] flex items-center justify-center text-zinc-500 text-xs">
                              لا توجد صورة
                            </div>
                          )}
                          
                          {/* تفاصيل الوجبة */}
                          <div className="flex-1 text-right flex flex-col gap-1.5">
                            <CardTitle className="text-xl font-bold text-white group-hover:text-orange-400 transition-colors duration-200 leading-tight">
                              {item.name}
                            </CardTitle>
                            {item.description && (
                              <CardDescription className="text-sm text-zinc-400 line-clamp-2 leading-relaxed">
                                {item.description}
                              </CardDescription>
                            )}
                          </div>
                        </div>
                      </CardHeader>

                      <CardContent className="p-0 flex flex-col gap-4">
                        <div className="flex items-center justify-between w-full pt-2 border-t border-white/[0.04]">
                          <span className="text-xl font-black text-orange-500">
                            ₪{item.price}
                          </span>
                          
                          {quantity === 0 ? (
                            <Button 
                              onClick={() => addToCart(item)} 
                              size="default"
                              className="bg-zinc-800 hover:bg-white hover:text-black rounded-xl px-5 py-2.5 font-bold text-xs transition-all duration-300 active:scale-95 border border-white/10 text-white"
                            >
                              <Plus className="w-4 h-4 ml-1" />
                              إضافة
                            </Button>
                          ) : (
                            <div className="flex items-center gap-1.5 bg-neutral-900 p-1 rounded-xl border border-white/[0.05]">
                              <Button
                                onClick={() => removeFromCart(item.id)}
                                size="sm"
                                className="h-8 w-8 p-0 rounded-lg bg-transparent hover:bg-white/10 text-zinc-400 hover:text-white"
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </Button>
                              <span className="w-7 text-center font-bold text-sm text-white">
                                {quantity}
                              </span>
                              <Button
                                onClick={() => addToCart(item)}
                                size="sm"
                                className="h-8 w-8 p-0 rounded-lg bg-transparent hover:bg-white/10 text-zinc-400 hover:text-white"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          )}
                        </div>

                        {quantity > 0 && (
                          <input
                            type="text"
                            placeholder="أضف ملاحظة خاصة بالطلب..."
                            className="w-full px-4 py-2.5 text-xs border border-white/[0.05] rounded-xl focus:outline-none focus:border-orange-500/50 bg-neutral-900 text-right text-zinc-200 placeholder-zinc-500 transition-all shadow-inner"
                            onChange={(e) => {
                              setCart((prev) =>
                                prev.map((cartItem) =>
                                  cartItem.id === item.id ? { ...cartItem, note: e.target.value } : cartItem
                                )
                              );
                            }}
                            value={cart.find((i) => i.id === item.id)?.note || ""}
                          />
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-16 text-zinc-500 bg-neutral-900/10 rounded-3xl border border-dashed border-white/[0.05]">
                <UtensilsCrossed className="w-10 h-10 mx-auto mb-3 opacity-20" />
                لا توجد أصناف متوفرة في هذا القسم حالياً.
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* الزر العائم للموبايل */}
      {totalItems > 0 && (
        <div className="fixed bottom-6 left-6 md:hidden z-40">
          <Button
            onClick={() => navigate(`/cart/${tableNumber || "1"}`)}
            size="lg"
            className="rounded-full shadow-2xl shadow-orange-600/30 bg-orange-600 hover:bg-orange-500 h-14 w-14 p-0 flex items-center justify-center border border-white/10 active:scale-95 transition-all"
          >
            <div className="relative">
              <ShoppingCart className="w-5 h-5 text-white" />
              <Badge className="absolute -top-3 -right-3 bg-white text-orange-600 border border-orange-600 rounded-full w-5 h-5 flex items-center justify-center p-0 text-[10px] font-black">
                {totalItems}
              </Badge>
            </div>
          </Button>
        </div>
      )}

      <MoreItemsDialog
        lastOrderTime={lastOrderTime}
        onContinueShopping={() => {}}
        onFinish={() => navigate(`/bill/${tableNumber || "1"}`)}
      />
    </div>
  );
}