import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, Smartphone } from "lucide-react";

const CTA = () => {
  return (
    <section className="py-20 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-orange-400/10 to-orange-600/10" />
      <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-96 h-96 bg-orange-300/20 rounded-full blur-3xl" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="space-y-6 rtl">
            <h2 className="font-persian text-3xl md:text-5xl font-bold text-primary">
              آماده شروع هستید؟
            </h2>
            
            <p className="font-persian text-xl md:text-2xl text-muted-foreground leading-relaxed">
              همین حالا شروع کنید و از تحلیل هوشمند غذای حیوان خانگی‌تان بهره‌مند شوید
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center rtl:space-x-reverse">
            <Link href="http://localhost:3001" target="_blank">
              <Button className="glass-button text-lg px-10 py-6 font-persian group">
                <span>شروع کنید</span>
                <ArrowLeft className="mr-3 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            
            <Link href="http://localhost:3001" target="_blank">
              <Button 
                variant="ghost" 
                className="glass-button-secondary text-lg px-10 py-6 font-persian group"
              >
                <Smartphone className="ml-3 w-5 h-5" />
                <span>مشاهده اپلیکیشن</span>
              </Button>
            </Link>
          </div>
          
          <div className="pt-8">
            <div className="glass-card inline-block px-8 py-4">
              <p className="font-persian text-base text-muted-foreground rtl">
                ✨ رایگان شروع کنید - بدون نیاز به کارت اعتباری
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTA;