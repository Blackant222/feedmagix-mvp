import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";

const Header = () => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/20">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 rtl:space-x-reverse">
            <Image 
              src="/petmagix-logo.png" 
              alt="PetMagix Logo" 
              width={40} 
              height={40} 
              className="rounded-xl"
            />
            <div className="rtl">
              <h1 className="font-persian text-xl font-bold text-primary">پت‌مجیکس</h1>
            </div>
          </div>
          
          <nav className="hidden md:flex items-center space-x-8 rtl:space-x-reverse font-persian">
            <a href="#features" className="text-muted-foreground hover:text-primary transition-colors rtl">خدمات</a>
            <a href="#about" className="text-muted-foreground hover:text-primary transition-colors rtl">درباره ما</a>
            <a href="#contact" className="text-muted-foreground hover:text-primary transition-colors rtl">تماس</a>
          </nav>

          <div className="flex items-center space-x-4 rtl:space-x-reverse">
            <Link href="http://localhost:3001/auth/signin" target="_blank">
              <Button variant="ghost" className="font-persian rtl hidden md:inline-flex">
                ورود
              </Button>
            </Link>
            <Link href="http://localhost:3001" target="_blank">
              <Button className="glass-button font-persian rtl">
                شروع کنید
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;