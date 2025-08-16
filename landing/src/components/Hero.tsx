import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import heroImage from "@/assets/hero-image.jpg";
import petsIllustration from "@/assets/pets-illustration.jpg";

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-orange-50/50 to-orange-100/30" />
      <div className="absolute top-20 right-10 w-64 h-64 bg-orange-300/20 rounded-full blur-3xl" />
      <div className="absolute bottom-20 left-10 w-96 h-96 bg-orange-400/10 rounded-full blur-3xl" />
      
      <div className="container mx-auto px-4 z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Hero Content */}
          <div className="text-center lg:text-right space-y-8 rtl">
            <div className="space-y-4">
              <div className="inline-flex items-center glass rounded-full px-6 py-3 mb-4">
                <span className="text-2xl ml-3">✨</span>
                <span className="font-persian text-lg font-medium text-primary">
                  بیایید و امتحان کنید!
                </span>
              </div>
              
              <h1 className="font-persian text-4xl md:text-6xl font-bold leading-tight">
                به{" "}
                <span className="text-gradient">پت‌مجیکس</span>{" "}
                خوش آمدید
              </h1>
              
              <p className="font-persian text-xl md:text-2xl text-muted-foreground leading-relaxed max-w-2xl mx-auto lg:mx-0">
                استارتاپ نوآور در زمینه مراقبت جامع از حیوانات خانگی - از تغذیه تا سلامت
              </p>
              
              <div className="bg-gradient-to-r from-orange-100 to-orange-50 rounded-2xl p-6 border border-orange-200">
                <div className="flex items-center gap-3 mb-3">
                   <Image src="/feedmagix-logo.png" alt="FeedMagix" width={32} height={32} className="rounded-lg" />
                   <h3 className="font-persian text-lg font-bold text-orange-800">فیدمجیکس</h3>
                 </div>
                <p className="font-persian text-orange-700 leading-relaxed">
                  اولین سرویس پت‌مجیکس که به صاحبان حیوانات خانگی کمک می‌کند تا با استفاده از هوش مصنوعی، بهترین تصمیمات تغذیه‌ای را برای دوستان چهارپای خود بگیرند.
                </p>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-end rtl:space-x-reverse space-x-4">
              <Link href="http://localhost:3001" target="_blank">
                <Button className="glass-button text-lg px-8 py-6 font-persian">
                  شروع کنید
                </Button>
              </Link>
              <Button 
                variant="ghost" 
                className="glass-button-secondary text-lg px-8 py-6 font-persian"
              >
                بیشتر بدانید
              </Button>
            </div>
          </div>
          
          {/* Hero Image */}
          <div className="relative">
            <div className="hero-glow">
              <div className="glass-card p-0 overflow-hidden float">
                <Image 
                  src={heroImage} 
                  alt="Hero illustration" 
                  className="w-full h-auto rounded-2xl shadow-2xl transform hover:scale-105 transition-transform duration-300"
                />
              </div>
            </div>
            
            {/* Floating Pet Illustration */}
            <div className="absolute -bottom-10 -left-10 w-40 h-40 glass-card p-4 hidden lg:block">
              <Image 
                src={petsIllustration} 
                alt="Pets illustration" 
                className="absolute bottom-4 right-4 w-24 h-24 rounded-full border-4 border-white shadow-lg"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;