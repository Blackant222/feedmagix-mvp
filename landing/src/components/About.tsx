import Image from "next/image";

const About = () => {
  return (
    <section id="about" className="py-20 bg-gradient-to-b from-white to-orange-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="font-persian text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            درباره ما
          </h2>
          <div className="w-24 h-1 bg-gradient-to-r from-orange-400 to-orange-600 mx-auto mb-8"></div>
        </div>
        
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div className="space-y-8 rtl">
            <div className="glass-card p-8">
              <div className="flex items-center gap-4 mb-6">
                <Image src="/petmagix-logo.png" alt="PetMagix" width={64} height={64} className="rounded-xl" />
                <div>
                  <h3 className="font-persian text-2xl font-bold text-gray-900">پت‌مجیکس</h3>
                  <p className="font-persian text-orange-600 font-medium">استارتاپ نوآور ایرانی</p>
                </div>
              </div>
              
              <p className="font-persian text-lg leading-relaxed text-gray-700 mb-6">
                ما یک استارتاپ نوآور در تهران، ایران هستیم که با هدف آسان‌سازی مراقبت از حیوانات خانگی در تمام جنبه‌ها فعالیت می‌کنیم. از تغذیه و سلامت گرفته تا مراقبت‌های روزانه، ما تلاش می‌کنیم تا دوستان چهارپای شما زندگی بهتر، سالم‌تر و طولانی‌تری داشته باشند.
              </p>
              
              <div className="bg-gradient-to-r from-orange-100 to-orange-50 rounded-xl p-6 border border-orange-200">
                <h4 className="font-persian text-xl font-bold text-orange-800 mb-4">ماموریت ما</h4>
                <p className="font-persian text-orange-700 leading-relaxed">
                  ایجاد اکوسیستمی جامع برای مراقبت از حیوانات خانگی که با استفاده از فناوری‌های نوین، تجربه نگهداری از حیوانات خانگی را بهبود بخشد و به صاحبان کمک کند تا بهترین تصمیمات را برای سلامت و شادی دوستان چهارپای خود بگیرند.
                </p>
              </div>
            </div>
            
            {/* Services */}
            <div className="space-y-6">
              <h4 className="font-persian text-2xl font-bold text-gray-900 text-center">سرویس‌های ما</h4>
              
              {/* Current Service */}
              <div className="glass-card p-6 border-r-4 border-orange-500">
                <div className="flex items-center gap-3 mb-4">
                  <Image src="/feedmagix-logo.png" alt="FeedMagix" width={40} height={40} className="rounded-lg" />
                  <div>
                    <h5 className="font-persian text-xl font-bold text-gray-900">فیدمجیکس</h5>
                    <span className="font-persian text-sm bg-green-100 text-green-800 px-3 py-1 rounded-full">فعال</span>
                  </div>
                </div>
                <p className="font-persian text-gray-700 leading-relaxed">
                  اولین سرویس پت‌مجیکس که با استفاده از هوش مصنوعی، تحلیل جامع غذای حیوانات خانگی ارائه می‌دهد و به صاحبان کمک می‌کند تا بهترین انتخاب‌های تغذیه‌ای را برای حیوان خانگی خود داشته باشند.
                </p>
              </div>
              
              {/* Upcoming Service */}
              <div className="glass-card p-6 border-r-4 border-blue-500 opacity-75">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                    <span className="text-white text-xl">🏥</span>
                  </div>
                  <div>
                    <h5 className="font-persian text-xl font-bold text-gray-900">پلتفرم B2B</h5>
                    <span className="font-persian text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded-full">به زودی</span>
                  </div>
                </div>
                <p className="font-persian text-gray-700 leading-relaxed">
                  پلتفرم جامع برای کلینیک‌های دامپزشکی و فروشگاه‌های لوازم حیوانات خانگی که امکان مدیریت بهتر خدمات و ارتباط مؤثرتر با مشتریان را فراهم می‌کند.
                </p>
              </div>
            </div>
          </div>
          
          {/* Visual Elements */}
          <div className="relative">
            <div className="hero-glow">
              <div className="glass-card p-8 text-center">
                <div className="text-6xl mb-6">🐾</div>
                <h4 className="font-persian text-2xl font-bold text-gray-900 mb-4">
                  چشم‌انداز ما
                </h4>
                <p className="font-persian text-lg text-gray-700 leading-relaxed">
                  تبدیل شدن به پیشرو در زمینه فناوری‌های مراقبت از حیوانات خانگی در منطقه و ایجاد جامعه‌ای از صاحبان آگاه و مسئول حیوانات خانگی
                </p>
              </div>
            </div>
            
            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 mt-8">
              <div className="glass-card p-6 text-center">
                <div className="text-3xl font-bold text-orange-600 mb-2">2025</div>
                <p className="font-persian text-sm text-gray-600">سال تأسیس</p>
              </div>
              <div className="glass-card p-6 text-center">
                <div className="text-3xl font-bold text-orange-600 mb-2">تهران</div>
                <p className="font-persian text-sm text-gray-600">مقر اصلی</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;