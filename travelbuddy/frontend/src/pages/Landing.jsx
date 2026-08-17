import Navbar from '../components/Navbar';
import { Link, useNavigate } from 'react-router-dom';
import { useWebSettings } from '../context/WebSettingsContext';

export default function Landing() {
  const { t } = useWebSettings();
  return (
    <div className="bg-surface font-body text-on-surface selection:bg-secondary-container">
      <Navbar showAuth={true} transparent={true} />

      {/* Hero Section */}
      <header className="relative h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            alt="Solo traveler at sunset"
            className="w-full h-full object-cover object-top"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuCy0Um3RsAmT8KKAocV0Vw-SgB3pC_I-yhh4ubVS696da9Q259PbaKJaKSAK0YQcsRLEkmYEaBOCmPELhU20yr2T1yRXn01xPOolxv4Vgpxd_MLkhZZVPEtmzDsHx0_34FqKNWrWyMMHesiYKhoQkvZ7RHc6LLQDT9EfH_9CzTooB-_1ylAtQ4cSNtOO12ThcCPVqD4TrrRREVtHb04LFj49D0gAkgCJt2zLWXZgnf2chI-W3N2eQAhJ92O3BYmWutgbh6OvqqePBWM"
          />
          <div className="absolute inset-0 hero-gradient-overlay"></div>
        </div>
        <div className="relative z-10 text-center px-6 max-w-5xl">
          <h1 className="font-headline font-extrabold text-white text-6xl md:text-8xl tracking-tighter mb-10 leading-[0.95]">
            {t('Your journey begins')} <br /> <span className="text-secondary-container">{t('at the horizon.')}</span>
          </h1>
          <p className="text-white/90 text-xl md:text-3xl font-medium mb-16 max-w-3xl mx-auto leading-relaxed shadow-sm">
            {t('Find safe, compatible solo travel companions for your next great adventure.')}
          </p>
          <div className="flex justify-center items-center">
            <Link
              to="/signup"
              className="adventure-gradient text-on-tertiary-fixed font-bold px-10 py-4 rounded-full text-lg transition-all hover:scale-105 shadow-xl inline-block"
            >
              {t('Join the Adventure')}
            </Link>
          </div>
        </div>
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 text-white/50 animate-bounce">
          <span className="material-symbols-outlined text-4xl">keyboard_double_arrow_down</span>
        </div>
      </header>

      {/* Features Section (Bento Grid) */}
      <section className="py-32 px-8 max-w-screen-2xl mx-auto tonal-shift-bg">
        <div className="mb-20 text-center">
          <span className="font-label text-secondary uppercase tracking-widest font-bold">{t('The Core Pillars')}</span>
          <h2 className="font-headline text-4xl md:text-5xl font-extrabold text-primary mt-4">{t('Redefining Solo Exploration')}</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 h-auto">
          {/* Feature 1: Safety */}
          <div className="md:col-span-8 bg-surface-container-lowest p-10 rounded-[2rem] shadow-sm flex flex-col justify-between overflow-hidden relative group">
            <div className="relative z-10">
              <div className="w-14 h-14 bg-secondary-fixed rounded-2xl flex items-center justify-center text-secondary mb-8 shadow-inner">
                <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>verified_user</span>
              </div>
              <h3 className="font-headline text-3xl font-bold text-primary mb-4">{t('Safety First')}</h3>
              <p className="text-on-surface-variant text-lg max-w-md leading-relaxed">
                {t('Our multi-layer verification system ensures every nomad is who they say they are. Real-time GPS sharing and emergency SOS features come standard.')}
              </p>
            </div>
            <div className="mt-12 flex flex-wrap items-center gap-4 relative z-10">
              <span className="px-4 py-2 bg-secondary-fixed text-on-secondary-fixed rounded-full font-label text-xs font-bold">ID VERIFIED</span>
            </div>
            <div className="absolute -right-10 -bottom-10 opacity-5 group-hover:opacity-10 transition-opacity">
              <span className="material-symbols-outlined text-[240px]">shield</span>
            </div>
          </div>

          {/* Feature 2: Smart Matching */}
          <div className="md:col-span-4 bg-primary text-white p-10 rounded-[2rem] shadow-xl flex flex-col justify-between overflow-hidden relative">
            <div>
              <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center mb-8">
                <span className="material-symbols-outlined text-3xl text-primary-fixed">psychology</span>
              </div>
              <h3 className="font-headline text-3xl font-bold mb-4">{t('Smart Matching')}</h3>
              <p className="text-primary-fixed-dim text-lg leading-relaxed">
                {t('Algorithm-based personality assessment connects you with travelers who share your pace, budget, and curiosity.')}
              </p>
            </div>
            <div className="mt-8">
              <img
                alt="Travelers matching"
                className="rounded-xl w-full h-40 object-cover opacity-60"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDN8QeZccyFn8lcpDjpdbnEQibKhliWKDsykTyUnzN4qnVoXAQgIsWBxXCMDnf9EFevIdzhukU9vZ8Md0ejmpGjU7VIFbykqzLHvE4Z1HO76hQmzA0qAKGf8-yQYknF1LJLPcGKa1a0nKdCNZImSJvP8pjcEMMBg9XEAUoVohOwbAp6tPY4XQXMXEsHvd0ySpuG1E9-5qdzZVlUFeGbYW_Jy7Oiq3dNNBtYUW2qmdNM4xt9-woL5Ip-OwmowZsZpXQevZ_z4bA6M849"
              />
            </div>
          </div>

          {/* Feature 3: The Trip Pact */}
          <div className="md:col-span-12 bg-surface-container-low p-12 rounded-[2rem] flex flex-col md:flex-row items-center gap-12">
            <div className="flex-1">
              <div className="w-14 h-14 bg-tertiary-fixed rounded-2xl flex items-center justify-center text-on-tertiary-fixed-variant mb-8 shadow-inner">
                <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>handshake</span>
              </div>
              <h3 className="font-headline text-3xl font-bold text-primary mb-4">{t('The Trip Pact')}</h3>
              <p className="text-on-surface-variant text-lg leading-relaxed">
                {t('Before you pack, you align. Our unique "Pact" feature lets companions agree on itinerary flexibility, expense splitting, and boundaries before the first flight.')}
              </p>
            </div>
            <div className="flex-1 grid grid-cols-2 gap-4">
              <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-sm">
                <span className="block text-4xl font-black text-tertiary mb-2">98%</span>
                <span className="text-sm font-label text-outline uppercase tracking-wider">Pact Success Rate</span>
              </div>
              <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-sm">
                <span className="block text-4xl font-black text-secondary mb-2">15k+</span>
                <span className="text-sm font-label text-outline uppercase tracking-wider">Trips Planned</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-32 bg-surface">
        <div className="max-w-screen-2xl mx-auto px-8">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
            <div className="max-w-2xl">
              <span className="font-label text-secondary uppercase tracking-widest font-bold">{t('Trusted Explorers')}</span>
              <h2 className="font-headline text-4xl md:text-5xl font-extrabold text-primary mt-4">{t('Real stories from the edge of the map.')}</h2>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Testimonial 1 */}
            <div className="bg-surface-container-lowest p-8 rounded-[1.5rem] shadow-sm flex flex-col gap-8">
              <div className="flex text-amber-400">
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
              </div>
              <p className="text-on-surface-variant text-lg leading-relaxed italic">
                "I was nervous about solo travel in Iceland, but through TravelBuddy, I met Sarah. Our Trip Pact made everything clear, and now we're planning our third trip together!"
              </p>
              <div className="flex items-center gap-4 pt-6 border-t border-surface-container">
                <img
                  alt="Trusted explorer avatar"
                  className="w-12 h-12 rounded-full object-cover"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuCZrzmVcuR6bfw3n17WZ0MnUqKd8565VcHN5YuGCpXxIcsyv8NKzrIx47LzekVesminqkM0_Tujnq7R3uPoUke7nUxQ0j2no8D5P_3YYQlhh7f6z8y9K6IQXY6N3MiYMHC3XulnG9q5vF1_zsJJGw5PC6nepQaAkuiwrLPTl_tH6T-hqeeiFOI7-ALYgzLzuEVnQtUgIKeKcyRkteDuLvDurrluz9GdNvXUEulzFTLmTq6AYXQefz7BCojFJDosaRTfxZG0SVTB7qAK"
                />
                <div>
                  <p className="font-bold text-primary">Elena Rodriguez</p>
                  <p className="text-xs font-label text-outline uppercase">Global Explorer • 12 Countries</p>
                </div>
              </div>
            </div>

            {/* Testimonial 2 */}
            <div className="bg-surface-container-lowest p-8 rounded-[1.5rem] shadow-sm flex flex-col gap-8 border-t-4 border-amber-400">
              <div className="flex text-amber-400">
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
              </div>
              <p className="text-on-surface-variant text-lg leading-relaxed italic">
                "The safety features are what sold me. Having a verified companion means I can explore off-the-beaten-path locations with confidence."
              </p>
              <div className="flex items-center gap-4 pt-6 border-t border-surface-container">
                <img
                  alt="Trusted explorer avatar"
                  className="w-12 h-12 rounded-full object-cover"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuDXyQz3tYJr3B9UoTjiK54M5UJdSMbjRhHM9HgaN7UAO1YhL4CITJaRfLQSx29kzO0Byq9wKHymGBiYpVhFlYqUAsOP54cvq00UeNtJrsd8qPwwZ6fs5No6--BkKH7aNxwJ81Xp4rUw-RKU8aWFKVN6rv5rc-Kx41OLguVrRHoR4qHBZoIPCeLOGSdTrZJH41v-7c7t7rcXyoCLvN3GI9D7tqGL-tcy3d6Itw9dpPJ7ZrQ3ihMo01t1RIJ7b4X698kQiB-yoG9DLXFx"
                />
                <div>
                  <p className="font-bold text-primary">Marcus Chen</p>
                  <p className="text-xs font-label text-outline uppercase">Mountain Trekker • 8 Expeditions</p>
                </div>
              </div>
            </div>

            {/* Testimonial 3 */}
            <div className="bg-surface-container-lowest p-8 rounded-[1.5rem] shadow-sm flex flex-col gap-8">
              <div className="flex text-amber-400">
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
              </div>
              <p className="text-on-surface-variant text-lg leading-relaxed italic">
                "The matching algorithm is scarily good. My buddy and I had the exact same food budget and museum interests. It felt like traveling with an old friend."
              </p>
              <div className="flex items-center gap-4 pt-6 border-t border-surface-container">
                <img
                  alt="Trusted explorer avatar"
                  className="w-12 h-12 rounded-full object-cover"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuAcgY22T3QpJPMO5clF-sPpXvEUOisyZ1pKkUBKOrh5sHPtzTtKbW4CqHuB_D3N8R5BgMAS484CjDcxUlVZ7RHF2F2NmADLzS6eaGn8FFr2JYwLph0b8R6m8gwvi1eYeDZYVApUFhCTArlUmF8wH_dfZQzXSgz03hRkliUp7dHe1Qt_Nsa9nreYgn0tuuxjq1QIimP6D7Jq6dZSkf5SbXNCcEuJG-IbyI7CKu9Wbd3gVksuYi7evQ-QpuIpjaPjssMusNlREK3DkNe9"
                />
                <div>
                  <p className="font-bold text-primary">Sophie Larsson</p>
                  <p className="text-xs font-label text-outline uppercase">Backpacker • 20+ Connections</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="py-24 px-8">
        <div className="max-w-screen-xl mx-auto adventure-gradient rounded-[3rem] p-16 text-center text-on-tertiary-fixed shadow-2xl relative overflow-hidden">
          <div className="relative z-10">
            <h2 className="font-headline text-5xl md:text-6xl font-black tracking-tighter mb-8">{t('Ready to see the horizon?')}</h2>
            <p className="text-xl md:text-2xl font-medium mb-12 max-w-2xl mx-auto opacity-90">
              {t('Stop waiting for others to be ready. Find your perfect travel buddy today and start exploring.')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/signup" className="flex items-center justify-center bg-primary text-white font-bold px-12 py-5 rounded-full text-lg hover:bg-primary-container transition-all shadow-lg inline-block">
                {t('Get Started Free')}
              </Link>
            </div>
          </div>
          {/* Decorative circle */}
          <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute -left-20 -top-20 w-80 h-80 bg-primary/10 rounded-full blur-3xl"></div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-100 dark:bg-slate-950 w-full py-12 border-t border-slate-200 dark:border-slate-800">
        <div className="flex flex-col md:flex-row justify-between items-center px-12 max-w-screen-2xl mx-auto font-['Inter'] text-xs uppercase tracking-widest gap-8">
          <div className="font-['Manrope'] font-bold text-slate-900 dark:text-slate-100 text-lg">
            TravelBuddy
          </div>
          <div className="flex gap-8 text-slate-500">
            <a className="hover:text-amber-600 transition-all opacity-80 hover:opacity-100" href="#">Safety Policy</a>
            <a className="hover:text-amber-600 transition-all opacity-80 hover:opacity-100" href="#">Travel Terms</a>
            <a className="hover:text-amber-600 transition-all opacity-80 hover:opacity-100" href="#">Privacy</a>
            <a className="hover:text-amber-600 transition-all opacity-80 hover:opacity-100" href="#">Contact</a>
          </div>
          <div className="text-slate-500">
            © {new Date().getFullYear()} TravelBuddy. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}