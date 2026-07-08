import { TrendingUp, Heart, UserPlus, Sparkles, Check } from "lucide-react";

const HeroFloatingCards = () => {
  return (
    <div className="relative w-full h-full min-h-[560px]">
      {/* Main lead card */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] sm:w-[340px] bg-white rounded-2xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.25)] p-5 z-10">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-300 to-amber-600 flex items-center justify-center text-sm font-bold text-white ring-2 ring-white">
              MC
            </div>
            <div>
              <div className="text-[15px] font-semibold text-neutral-900 leading-tight">Michael Chang</div>
              <div className="text-[12px] text-neutral-500">VP Sales · InnovateIQ</div>
            </div>
          </div>
          <span className="text-[10px] font-semibold px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
            2nd
          </span>
        </div>

        <div className="rounded-xl bg-neutral-50 p-3 mb-3">
          <div className="flex items-center gap-1.5 mb-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#3B82F6]" />
            <span className="text-[11px] font-semibold text-neutral-900 uppercase tracking-wider">Intent detected</span>
          </div>
          <p className="text-[13px] text-neutral-700 leading-snug">
            Liked 3 posts about sales automation this week
          </p>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <div className="text-[10px] text-neutral-500 uppercase tracking-wider">Match score</div>
            <div className="text-xl font-bold text-neutral-900">94<span className="text-sm text-neutral-500">/100</span></div>
          </div>
          <button className="bg-[#0a0a0a] text-white text-[12px] font-semibold rounded-lg px-4 py-2 hover:bg-neutral-800 transition-colors">
            Reach out
          </button>
        </div>
      </div>

      {/* Top-left floating card — Signal */}
      <div className="absolute top-[6%] left-[-4%] sm:left-[-2%] bg-white rounded-xl shadow-[0_12px_40px_-10px_rgba(0,0,0,0.2)] px-3.5 py-2.5 flex items-center gap-2.5 z-20 animate-float">
        <div className="w-8 h-8 rounded-full bg-rose-50 flex items-center justify-center shrink-0">
          <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
        </div>
        <div>
          <div className="text-[10px] font-medium text-neutral-500 leading-none mb-0.5">New signal</div>
          <div className="text-[12px] font-semibold text-neutral-900 leading-tight">Liked your post</div>
        </div>
      </div>

      {/* Top-right floating card — Follower */}
      <div
        className="absolute top-[18%] right-[-2%] sm:right-[0%] bg-white rounded-xl shadow-[0_12px_40px_-10px_rgba(0,0,0,0.2)] px-3.5 py-2.5 flex items-center gap-2.5 z-20 animate-float"
        style={{ animationDelay: "1s" }}
      >
        <div className="w-8 h-8 rounded-full bg-[#C8FF00] flex items-center justify-center shrink-0">
          <UserPlus className="w-4 h-4 text-neutral-900" />
        </div>
        <div>
          <div className="text-[10px] font-medium text-neutral-500 leading-none mb-0.5">+ Followed you</div>
          <div className="text-[12px] font-semibold text-neutral-900 leading-tight">Danielle H.</div>
        </div>
      </div>

      {/* Bottom-left floating card — Company */}
      <div
        className="absolute bottom-[14%] left-[0%] sm:left-[2%] bg-white rounded-xl shadow-[0_12px_40px_-10px_rgba(0,0,0,0.2)] px-3.5 py-2.5 flex items-center gap-2.5 z-20 animate-float"
        style={{ animationDelay: "2s" }}
      >
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-[10px] font-bold text-white shrink-0">
          RB
        </div>
        <div>
          <div className="text-[10px] font-medium text-neutral-500 leading-none mb-0.5 flex items-center gap-1">
            <TrendingUp className="w-2.5 h-2.5" /> Raised $12M
          </div>
          <div className="text-[12px] font-semibold text-neutral-900 leading-tight">RevBoost</div>
        </div>
      </div>

      {/* Bottom-right floating card — Meeting booked */}
      <div
        className="absolute bottom-[6%] right-[-2%] sm:right-[2%] bg-white rounded-xl shadow-[0_12px_40px_-10px_rgba(0,0,0,0.2)] px-3.5 py-2.5 flex items-center gap-2.5 z-20 animate-float"
        style={{ animationDelay: "3s" }}
      >
        <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
          <Check className="w-4 h-4 text-white" strokeWidth={3} />
        </div>
        <div>
          <div className="text-[10px] font-medium text-neutral-500 leading-none mb-0.5">Meeting booked</div>
          <div className="text-[12px] font-semibold text-neutral-900 leading-tight">Tue · 2:00 PM</div>
        </div>
      </div>
    </div>
  );
};

export default HeroFloatingCards;
