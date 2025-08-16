import Image from "next/image";

const Footer = () => {
  return (
    <footer className="relative py-16 border-t border-white/20">
      <div className="absolute inset-0 glass" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4 rtl">
            <div className="flex items-center space-x-3 rtl:space-x-reverse justify-center md:justify-end">
              <Image 
                src="/petmagix-logo.png" 
                alt="PetMagix Logo" 
                width={48} 
                height={48} 
                className="rounded-xl"
              />
              <h3 className="font-persian text-2xl font-bold text-primary">پت‌مجیکس</h3>
            </div>
            <p className="font-persian text-muted-foreground leading-relaxed">
              استارتاپ نوآور در زمینه مراقبت از حیوانات خانگی - تهران، ایران
            </p>
            <p className="font-persian text-muted-foreground leading-relaxed text-sm">
              ما در پت‌مجیکس تلاش می‌کنیم تا مراقبت از حیوانات خانگی را در تمام جنبه‌ها آسان‌تر کنیم
            </p>
          </div>
          
          {/* App Links */}
          <div className="space-y-4 rtl">
            <h4 className="font-persian text-lg font-semibold text-primary">اپلیکیشن</h4>
            <ul className="space-y-2 font-persian">
              <li>
                <a 
                  href="http://localhost:3001" 
                  className="text-muted-foreground hover:text-primary transition-colors"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  اپلیکیشن اصلی
                </a>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                  نسخه جایگزین
                </a>
              </li>
            </ul>
          </div>
          
          {/* Services */}
          <div className="space-y-4 rtl">
            <h4 className="font-persian text-lg font-semibold text-primary">خدمات</h4>
            <ul className="space-y-2 font-persian">
              <li>
                <a href="#features" className="text-muted-foreground hover:text-primary transition-colors">
                  تحلیل هوشمند
                </a>
              </li>
              <li>
                <a href="#features" className="text-muted-foreground hover:text-primary transition-colors">
                  بینش‌های سلامت
                </a>
              </li>
              <li>
                <a href="#features" className="text-muted-foreground hover:text-primary transition-colors">
                  اسکن آسان
                </a>
              </li>
            </ul>
          </div>
          
          {/* Company */}
          <div className="space-y-4 rtl">
            <h4 className="font-persian text-lg font-semibold text-primary">شرکت</h4>
            <ul className="space-y-2 font-persian">
              <li>
                <a href="#about" className="text-muted-foreground hover:text-primary transition-colors">
                  درباره ما
                </a>
              </li>
              <li>
                <a href="#contact" className="text-muted-foreground hover:text-primary transition-colors">
                  تماس با ما
                </a>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                  حریم خصوصی
                </a>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-white/20 mt-12 pt-8">
          <p className="font-persian text-center text-muted-foreground rtl">
            © ۲۰۲۴ فیدمجیکس. تمامی حقوق محفوظ است.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;