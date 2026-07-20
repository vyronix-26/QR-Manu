import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Textarea } from "../components/ui/textarea";
import { Star, ExternalLink } from "lucide-react";
import { toast } from "sonner";

export function RatingPage() {
  const navigate = useNavigate();
  const { tableNumber } = useParams<{ tableNumber: string }>();
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (rating === 0) {
      toast.error("يرجى اختيار تقييم");
      return;
    }

    // Save rating to localStorage
    const ratings = JSON.parse(localStorage.getItem("hotel_ratings") || "[]");
    ratings.push({
      tableNumber,
      rating,
      comment,
      timestamp: Date.now(),
    });
    localStorage.setItem("hotel_ratings", JSON.stringify(ratings));

    setSubmitted(true);
    toast.success("شكراً لملاحظاتك!");
  };

  const handleGoogleReview = () => {
    // توجيه الزبون لصفحة تقييمات جوجل الخاصة بالمطعم
    window.open("https://www.google.com", "_blank");
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4" dir="rtl">
        <Card className="max-w-md w-full text-center bg-neutral-950/90 border border-white/[0.08] text-white rounded-3xl shadow-2xl">
          <CardContent className="py-12">
            <div className="w-20 h-20 bg-[#ff4500]/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-[#ff4500]/20">
              <Star className="w-10 h-10 text-[#ff4500] fill-[#ff4500]" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">شكراً لك!</h2>
            <p className="text-neutral-400 mb-8">
              تساعدنا ملاحظاتك على تحسين خدماتنا دائماً
            </p>

            {rating >= 4 && (
              <div className="bg-neutral-900/50 border border-white/[0.08] rounded-2xl p-4 mb-6">
                <p className="text-sm font-semibold text-[#ff4500] mb-2">
                  هل أعجبتك خدمتنا؟
                </p>
                <p className="text-xs text-neutral-400 mb-3">
                  ساعد الآخرين في اكتشاف مطعم هاوس بكتابة تقييم على جوجل!
                </p>
                <Button
                  onClick={handleGoogleReview}
                  variant="outline"
                  className="w-full border-white/[0.08] hover:bg-neutral-900 bg-transparent text-white"
                >
                  <ExternalLink className="w-4 h-4 ml-2" />
                  تقييم على جوجل
                </Button>
              </div>
            )}

            <div className="space-y-2">
              <Button
                onClick={() => navigate(`/table/${tableNumber}`)}
                className="w-full bg-[#ff4500] hover:bg-[#ff4500]/90 text-white rounded-xl"
                size="lg"
              >
                طلب جديد
              </Button>
              <Button
                onClick={() => navigate("/")}
                variant="outline"
                className="w-full border-white/[0.08] hover:bg-neutral-900 bg-transparent text-neutral-400 hover:text-white rounded-xl"
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
    <div className="min-h-screen bg-black flex items-center justify-center p-4" dir="rtl">
      <Card className="max-w-md w-full bg-neutral-950/90 border border-white/[0.08] text-white rounded-3xl shadow-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl text-white font-bold">قيّم تجربتك</CardTitle>
          <p className="text-sm text-neutral-400 mt-2">
            طاولة {tableNumber} • مطعم هاوس 
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Star Rating */}
          <div>
            <p className="text-center text-sm text-neutral-400 mb-4">
              كيف كانت تجربتك في تناول الطعام؟
            </p>
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    className={`w-12 h-12 transition-colors duration-200 ${
                      star <= (hoveredRating || rating)
                        ? "text-[#ff4500] fill-[#ff4500]"
                        : "text-neutral-700"
                    }`}
                  />
                </button>
              ))}
            </div>
            {rating > 0 && (
              <p className="text-center mt-3 font-semibold text-neutral-200">
                {rating === 5 && "ممتاز! ⭐"}
                {rating === 4 && "جيد جداً! 😊"}
                {rating === 3 && "جيد 👍"}
                {rating === 2 && "مقبول 😐"}
                {rating === 1 && "ضعيف 😞"}
              </p>
            )}
          </div>

          {/* Comment */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-neutral-300">
              أخبرنا المزيد (اختياري)
            </label>
            <Textarea
              placeholder="شارك تجربتك معنا..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              className="resize-none bg-neutral-900/50 border border-white/[0.08] text-white placeholder-neutral-500 rounded-2xl focus:border-[#ff4500] focus:ring-[#ff4500]/20"
            />
          </div>

          {/* Buttons */}
          <div className="space-y-3">
            <Button
              onClick={handleSubmit}
              className="w-full bg-[#ff4500] hover:bg-[#ff4500]/90 text-white rounded-xl font-bold transition-all duration-300 disabled:opacity-40 disabled:hover:bg-[#ff4500]"
              size="lg"
              disabled={rating === 0}
            >
              إرسال التقييم
            </Button>

            <Button
              onClick={() => navigate("/")}
              variant="ghost"
              className="w-full text-neutral-400 hover:text-white hover:bg-neutral-900/50 rounded-xl"
            >
              تخطي الآن
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}