import Image from "next/image";

const Contact = () => {
  return (
    <section id="contact" className="py-20 bg-gradient-to-b from-orange-50 to-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="font-persian text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            تماس با ما
          </h2>
          <div className="w-24 h-1 bg-gradient-to-r from-orange-400 to-orange-600 mx-auto mb-8"></div>
          <p className="font-persian text-xl text-gray-600 max-w-2xl mx-auto">
            ما همیشه آماده شنیدن نظرات و پیشنهادات شما هستیم. با ما در ارتباط باشید!
          </p>
        </div>
        
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Contact Information */}
          <div className="space-y-8 rtl">
            <div className="glass-card p-8">
              <div className="flex items-center gap-4 mb-8">
                <Image src="/petmagix-logo.png" alt="PetMagix" width={48} height={48} className="rounded-xl" />
                <div>
                  <h3 className="font-persian text-2xl font-bold text-gray-900">پت‌مجیکس</h3>
                  <p className="font-persian text-orange-600">تهران، ایران</p>
                </div>
              </div>
              
              {/* Contact Methods */}
              <div className="space-y-6">
                {/* Email */}
                <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-orange-50 to-orange-100 rounded-xl border border-orange-200">
                  <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center">
                    <span className="text-white text-xl">📧</span>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-persian text-lg font-bold text-gray-900 mb-1">ایمیل</h4>
                    <a href="mailto:arshia@petmagix.com" className="text-orange-600 hover:text-orange-700 transition-colors font-medium">
                      arshia@petmagix.com
                    </a>
                  </div>
                </div>
                
                {/* Phone */}
                <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-xl border border-green-200">
                  <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
                    <span className="text-white text-xl">📱</span>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-persian text-lg font-bold text-gray-900 mb-1">تلفن</h4>
                    <a href="tel:+989350728687" className="text-green-600 hover:text-green-700 transition-colors font-medium" dir="ltr">
                      +98 935 072 8687
                    </a>
                  </div>
                </div>
                
                {/* Instagram */}
                <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-pink-50 to-pink-100 rounded-xl border border-pink-200">
                  <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-purple-600 rounded-xl flex items-center justify-center">
                    <span className="text-white text-xl">📷</span>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-persian text-lg font-bold text-gray-900 mb-1">اینستاگرام</h4>
                    <a href="https://instagram.com/petmagix.ir" target="_blank" rel="noopener noreferrer" className="text-pink-600 hover:text-pink-700 transition-colors font-medium">
                      @petmagix.ir
                    </a>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Quick Message */}
            <div className="glass-card p-6">
              <h4 className="font-persian text-xl font-bold text-gray-900 mb-4">پیام سریع</h4>
              <p className="font-persian text-gray-700 leading-relaxed mb-4">
                سوال، پیشنهاد یا نظری دارید؟ از طریق ایمیل با ما در ارتباط باشید. ما معمولاً ظرف ۲۴ ساعت پاسخ می‌دهیم.
              </p>
              <a href="mailto:arshia@petmagix.com?subject=سوال درباره پت‌مجیکس" className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-xl font-persian font-medium transition-colors">
                <span>ارسال ایمیل</span>
                <span>📧</span>
              </a>
            </div>
          </div>
          
          {/* Visual/Info Section */}
          <div className="space-y-8">
            {/* Office Info */}
            <div className="glass-card p-8 text-center">
              <div className="text-6xl mb-6">🏢</div>
              <h4 className="font-persian text-2xl font-bold text-gray-900 mb-4">
                دفتر مرکزی
              </h4>
              <p className="font-persian text-lg text-gray-700 leading-relaxed mb-6">
                ایران - تهران - منطقه ۲۲- ایران مال - طبقه G1 - سرای آیندگان - فضای اشتراکی ۷ و ۸
              </p>
              <div className="bg-gradient-to-r from-orange-100 to-orange-50 rounded-xl p-6 border border-orange-200">
                <p className="font-persian text-orange-700 leading-relaxed">
                  ما در ایران مال تهران مستقر هستیم و با تیمی متخصص و پرانگیزه، روزانه برای بهبود زندگی حیوانات خانگی و صاحبانشان تلاش می‌کنیم.
                </p>
              </div>
            </div>
            
            {/* Working Hours */}
            <div className="glass-card p-6">
              <h4 className="font-persian text-xl font-bold text-gray-900 mb-6 text-center">ساعات پاسخگویی</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="font-persian font-medium text-gray-900">شنبه تا چهارشنبه</span>
                  <span className="font-persian text-gray-600" dir="ltr">9:00 - 18:00</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="font-persian font-medium text-gray-900">پنج‌شنبه</span>
                  <span className="font-persian text-gray-600" dir="ltr">9:00 - 14:00</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg border border-orange-200">
                  <span className="font-persian font-medium text-orange-800">جمعه</span>
                  <span className="font-persian text-orange-600">تعطیل</span>
                </div>
              </div>
              <p className="font-persian text-sm text-gray-500 text-center mt-4">
                * پاسخ ایمیل‌ها در تمام روز‌های هفته
              </p>
            </div>
            
            {/* Social Media */}
            <div className="glass-card p-6 text-center">
              <h4 className="font-persian text-xl font-bold text-gray-900 mb-4">ما را دنبال کنید</h4>
              <div className="flex justify-center">
                <a href="https://instagram.com/petmagix.ir" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-3 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-persian font-medium transition-all transform hover:scale-105">
                  <span>📷</span>
                  <span>@petmagix.ir</span>
                </a>
              </div>
              <p className="font-persian text-sm text-gray-600 mt-4">
                آخرین اخبار و به‌روزرسانی‌های ما را در اینستاگرام دنبال کنید
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;