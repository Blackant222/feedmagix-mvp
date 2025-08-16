import { Brain, Heart, Camera } from "lucide-react";

const Features = () => {
  const features = [
    {
      icon: Brain,
      title: "تحلیل هوشمند",
      description: "تکنولوژی پیشرفته هوش مصنوعی برای تحلیل مواد تشکیل‌دهنده غذای حیوانات",
      detail: "سیستم هوش مصنوعی ما تحلیل تغذیه‌ای دقیق و توصیه‌های تخصصی برای سلامت حیوان خانگی شما ارائه می‌دهد."
    },
    {
      icon: Heart,
      title: "بینش‌های سلامت",
      description: "دریافت توصیه‌های شخصی‌سازی شده برای حیوان خانگی شما",
      detail: "مشاوره تخصصی بر اساس نژاد، سن و شرایط سلامتی حیوان خانگی شما دریافت کنید."
    },
    {
      icon: Camera,
      title: "آسان در استفاده",
      description: "فرآیند ساده اسکن عکس",
      detail: "فقط از لیست مواد تشکیل‌دهنده عکس بگیرید و نتایج تحلیل فوری دریافت کنید."
    }
  ];

  return (
    <section id="features" className="py-20 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-orange-50/30" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16 rtl">
          <h2 className="font-persian text-3xl md:text-5xl font-bold text-primary mb-6">
            ویژگی‌های کلیدی
          </h2>
          <p className="font-persian text-xl text-muted-foreground max-w-3xl mx-auto">
            تکنولوژی پیشرفته ما برای تحلیل دقیق و ارائه بهترین توصیه‌ها
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="glass-card text-center group hover:scale-105 transition-all duration-300">
              <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center pulse-glow">
                <feature.icon className="w-8 h-8 text-white" />
              </div>
              
              <h3 className="font-persian text-2xl font-bold text-primary mb-4 rtl">
                {feature.title}
              </h3>
              
              <p className="font-persian text-lg text-muted-foreground mb-4 rtl leading-relaxed">
                {feature.description}
              </p>
              
              <p className="font-persian text-base text-muted-foreground rtl leading-relaxed">
                {feature.detail}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;