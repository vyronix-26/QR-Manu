import { useState } from "react";
import { useNavigate } from "react-router";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Check, Utensils } from "lucide-react";
import { motion } from "motion/react";

function QRCodeSVG() {
  const cell = 8;
  const pattern: number[][] = [
    [1,1,1,1,1,1,1,0,1,0,0,1,0,0,1,1,1,1,1,1,1],
    [1,0,0,0,0,0,1,0,0,1,1,0,1,0,1,0,0,0,0,0,1],
    [1,0,1,1,1,0,1,0,1,0,1,1,0,0,1,0,1,1,1,0,1],
    [1,0,1,1,1,0,1,0,0,1,0,0,1,0,1,0,1,1,1,0,1],
    [1,0,1,1,1,0,1,0,1,1,0,1,1,0,1,0,1,1,1,0,1],
    [1,0,0,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,0,0,1],
    [1,1,1,1,1,1,1,0,1,0,1,0,1,0,1,1,1,1,1,1,1],
    [0,0,0,0,0,0,0,0,1,1,0,1,1,0,0,0,0,0,0,0,0],
    [1,0,1,1,0,1,1,1,0,0,1,1,0,1,1,0,1,0,1,1,0],
    [0,1,0,0,1,0,0,1,1,0,0,1,0,0,0,1,0,1,0,0,1],
    [1,1,0,1,1,0,1,0,0,1,0,0,1,0,1,1,0,1,0,1,1],
    [0,0,1,0,0,1,0,1,0,1,1,0,0,1,0,0,1,0,1,0,0],
    [1,0,1,1,0,0,1,1,1,0,0,1,0,1,1,1,0,1,1,0,1],
    [0,0,0,0,0,0,0,0,1,0,1,1,0,0,0,0,0,0,0,0,0],
    [1,1,1,1,1,1,1,0,0,1,0,0,1,0,1,0,1,1,0,1,0],
    [1,0,0,0,0,0,1,0,1,1,1,0,0,1,0,1,0,0,1,0,1],
    [1,0,1,1,1,0,1,0,0,0,0,1,1,0,1,0,1,0,0,1,1],
    [1,0,1,1,1,0,1,0,1,0,1,0,0,1,0,1,0,1,0,1,0],
    [1,0,1,1,1,0,1,0,0,1,1,0,1,1,1,0,0,0,1,1,0],
    [1,0,0,0,0,0,1,0,1,0,0,1,0,0,0,1,1,0,0,0,1],
    [1,1,1,1,1,1,1,0,0,1,0,0,1,0,1,0,0,1,0,1,0],
  ];

  const size = pattern.length * cell;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="rounded-lg">
      {/* خلفية الـ QR معتمة خفيفة لتتناسب مع الطابع الداكن */}
      <rect width={size} height={size} fill="#18181b" />
      {pattern.map((row, r) =>
        row.map((val, c) =>
          val === 1 ? (
            <rect
              key={`${r}-${c}`}
              x={c * cell}
              y={r * cell}
              width={cell}
              height={cell}
              fill="#f97316" /* لون برتقالي نيون للـ QR */
            />
          ) : null
        )
      )}
    </svg>
  );
}

export function ScanPage() {
  const navigate = useNavigate();
  const [isScanning, setIsScanning] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [tableNumber, setTableNumber] = useState<number | null>(null);

  const handleScan = () => {
    setIsScanning(true);
    const randomTable = Math.floor(Math.random() * 12) + 1;

    setTimeout(() => {
      setIsScanning(false);
      setScanned(true);
      setTableNumber(randomTable);

      setTimeout(() => {
        navigate(`/table/${randomTable}`);
      }, 2500);
    }, 1500);
  };

  return (
    <div className="relative min-h-screen bg-black/75 text-zinc-100 flex items-center justify-center p-4 antialiased">
      <div className="max-w-sm w-full">
        {!scanned ? (
          /* 1. واجهة المسح الزجاجية */
          <Card className="text-center rounded-3xl bg-neutral-950/80 backdrop-blur-md border border-white/[0.08] shadow-[0_20px_50px_rgba(0,0,0,0.8)] overflow-hidden">
            <CardContent className="pt-8 pb-8 flex flex-col items-center">
              
              {/* ترويسة المطعم الفاخر */}
              <div className="flex items-center justify-center gap-3 mb-6 flex-row-reverse">
                <div className="w-10 h-10 bg-orange-500/10 border border-orange-500/20 rounded-full flex items-center justify-center text-orange-500">
                  <Utensils className="w-5 h-5" />
                </div>
                <div className="text-right">
                  <p className="font-black text-white text-lg leading-tight">مطعم هاوس</p>
                  <p className="text-[10px] font-bold text-zinc-500 tracking-wider">مطعم فاخر</p>
                </div>
              </div>

              {/* تأثيرات مسح الـ QR التفاعلية */}
              <motion.div
                animate={isScanning ? { scale: [1, 1.03, 1], opacity: [1, 0.8, 1] } : {}}
                transition={{ duration: 0.8, repeat: isScanning ? Infinity : 0 }}
                className="mb-6 flex flex-col items-center"
              >
                <div className="relative inline-block p-3.5 bg-neutral-900 rounded-2xl border border-white/[0.08] shadow-2xl">
                  <QRCodeSVG />
                  {isScanning && (
                    <div className="absolute inset-0 rounded-2xl overflow-hidden">
                      {/* خط الليزر المضيء */}
                      <motion.div
                        className="absolute left-0 right-0 h-0.5 bg-orange-500 shadow-[0_0_12px_4px_rgba(249,115,22,0.6)]"
                        animate={{ top: ["10%", "90%", "10%"] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                      />
                    </div>
                  )}
                </div>
                <p className="text-[10px] font-bold text-zinc-500 mt-3.5 uppercase tracking-widest">
                  {isScanning ? "جارٍ مسح رمز QR دقيق..." : "رمز QR للطاولة"}
                </p>
              </motion.div>

              <div className="space-y-1.5 mb-6">
                <h1 className="text-xl font-black text-white">
                  مرحباً بك في مطعم هاوس
                </h1>
                <p className="text-zinc-400 text-xs px-2 leading-relaxed">
                  امسح رمز الاستجابة السريعة على طاولتك لعرض القائمة وتقديم الطلب بشكل مباشر
                </p>
              </div>

              {/* زر المسح الزجاجي المضيء */}
              <Button
                size="lg"
                className="w-full py-6 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs transition-all duration-300 shadow-lg shadow-orange-600/15"
                onClick={handleScan}
                disabled={isScanning}
              >
                {isScanning ? "جارٍ المسح..." : "اضغط لمسح رمز QR"}
              </Button>

              <p className="text-[10px] text-zinc-600 font-bold mt-4 uppercase tracking-wider">
                لكل طاولة رمز QR مخصص
              </p>
            </CardContent>
          </Card>
        ) : (
          /* 2. واجهة نجاح التعرف والتحويل (Success Screen) */
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
          >
            <Card className="text-center overflow-hidden rounded-3xl bg-neutral-950/80 backdrop-blur-md border border-emerald-500/20 shadow-[0_15px_50px_rgba(16,185,129,0.1)]">
              {/* رأس التنبيه بنجاح المسح */}
              <div className="h-44 bg-gradient-to-br from-orange-600/80 to-red-600/80 backdrop-blur-sm flex flex-col items-center justify-center border-b border-white/[0.04]">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-3 shadow-lg"
                >
                  <Check className="w-8 h-8 text-emerald-600 stroke-[3]" />
                </motion.div>
                <p className="text-white font-black text-md">تم مسح رمز QR بنجاح!</p>
              </div>

              <CardContent className="pt-6 pb-8 flex flex-col items-center">
                <h1 className="text-xl font-black text-white mb-1.5">
                  مرحباً بك في مطعم هاوس
                </h1>
                <p className="text-orange-500 font-black text-2xl mb-1.5">
                  طاولة {tableNumber}
                </p>
                <p className="text-xs text-zinc-400 mb-6">
                  جارٍ تحميل قائمتك الشخصية وتوصيلك بالنظام...
                </p>

                {/* نقاط التحميل المضيئة */}
                <div className="flex justify-center gap-2">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      className="w-2.5 h-2.5 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.5)]"
                      animate={{ scale: [1, 1.4, 1], opacity: [0.4, 1, 0.4] }}
                      transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.2 }}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}