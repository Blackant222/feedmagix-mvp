import { TrendingUp, Users, Award, Clock } from "lucide-react";

const Stats = () => {
  const stats = [
    {
      icon: Award,
      number: "۱۰۰+",
      label: "برند تحلیل شده",
      description: "(شامل تست‌های داخلی و نمونه‌های فرضی)"
    },
    {
      icon: Users,
      number: "۳۰۰+",
      label: "کاربر منتظر",
      description: "(لیست علاقه‌مندان و ثبت‌نام اولیه)"
    },
    {
      icon: TrendingUp,
      number: "۹۰٪",
      label: "دقت تحلیل",
      description: "(بر اساس داده‌های آزمایشی و مدل AI اولیه)"
    },
    {
      icon: Clock,
      number: "۲۴/۷",
      label: "پشتیبانی",
      description: "(پاسخ‌گویی سریع در ساعات کاری و فوریت‌ها)"
    }
  ];

  return (
    <section className="py-20 relative">
      <div className="absolute inset-0 bg-gradient-to-r from-orange-50/50 to-orange-100/30" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <div key={index} className="glass-card text-center group">
              <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center">
                <stat.icon className="w-8 h-8 text-white" />
              </div>
              
              <div className="space-y-2 rtl">
                <div className="text-4xl md:text-5xl font-bold text-gradient font-persian">
                  {stat.number}
                </div>
                
                <h3 className="font-persian text-xl font-semibold text-primary">
                  {stat.label}
                </h3>
                
                <p className="font-persian text-sm text-muted-foreground leading-relaxed">
                  {stat.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Stats;