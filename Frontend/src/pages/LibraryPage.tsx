import { Link } from "react-router-dom";
import { PageLayout } from "../components/layout/PageLayout";
import { Clock, MapPin, Phone, ExternalLink, Globe, ArrowLeft } from "lucide-react";

export default function LibraryPage() {
  return (
    <PageLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Back Button */}
        <div className="mb-6">
            <Link to="/dashboard" className="inline-flex items-center text-sm text-slate-500 hover:text-ionian-blue dark:text-gray-400 dark:hover:text-white transition-colors">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
            </Link>
        </div>

        {/* Header */}
        <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-2">
                University Library
            </h1>
            <p className="text-slate-500 dark:text-gray-400">
                Resources, study spaces, and academic support.
            </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column: Info Cards */}
            <div className="lg:col-span-1 space-y-6">
                
                {/* Contact & Hours Card */}
                <div className="bg-white dark:bg-surface border border-slate-200 dark:border-white/10 rounded-3xl p-6 shadow-sm">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                        <Clock className="text-amber-500" /> Opening Hours
                    </h2>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-white/5">
                            <span className="text-slate-600 dark:text-gray-300">Monday - Friday</span>
                            <span className="font-semibold text-slate-900 dark:text-white">09:00 - 18:00</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-white/5">
                            <span className="text-slate-600 dark:text-gray-300">Weekend</span>
                            <span className="font-semibold text-slate-400 dark:text-gray-500">Closed</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-surface border border-slate-200 dark:border-white/10 rounded-3xl p-6 shadow-sm">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                        <MapPin className="text-ionian-blue" /> Contact
                    </h2>
                    <div className="space-y-4">
                        <div className="flex items-start gap-4">
                            <MapPin className="w-5 h-5 text-slate-400 mt-1" />
                            <div>
                                <p className="text-slate-900 dark:text-white font-medium">Ioannou Theotoki 72</p>
                                <p className="text-slate-500 text-sm">491 32 Corfu, Greece</p>
                            </div>
                        </div>
                         <div className="flex items-center gap-4">
                            <Phone className="w-5 h-5 text-slate-400" />
                            <a href="tel:2661087323" className="text-slate-900 dark:text-white hover:text-ionian-blue transition-colors">
                                26610 87323
                            </a>
                        </div>
                        <div className="flex items-center gap-4">
                            <Globe className="w-5 h-5 text-slate-400" />
                            <a 
                                href="https://library.ionio.gr/" 
                                target="_blank" 
                                rel="noreferrer"
                                className="text-ionian-blue hover:underline"
                            >
                                library.ionio.gr
                            </a>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Column: Map or Hero Image */}
            <div className="lg:col-span-2">
                 <div className="h-full min-h-[400px] bg-slate-100 dark:bg-white/5 rounded-3xl border border-slate-200 dark:border-white/10 overflow-hidden relative group">
                    {/* Placeholder for Map - Using an Iframe for Corfu University or just a static image */}
                    <iframe 
                        width="100%" 
                        height="100%" 
                        style={{ border: 0, minHeight: '400px' }}
                        loading="lazy" 
                        allowFullScreen 
                        src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3090.776606558486!2d19.91461631566817!3d39.62562637943764!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x135b5dd9f9ad729b%3A0x7b0767c960309104!2sIonian%20University!5e0!3m2!1sen!2sgr!4v1672661087323!5m2!1sen!2sgr"
                    ></iframe>
                     <div className="absolute bottom-6 right-6">
                        <a 
                            href="https://maps.app.goo.gl/example" 
                            target="_blank" 
                            rel="noreferrer"
                            className="bg-white text-slate-900 px-4 py-2 rounded-full shadow-lg font-medium hover:bg-slate-50 transition-colors flex items-center gap-2"
                        >
                            <ExternalLink size={16} /> Open in Maps
                        </a>
                     </div>
                 </div>
            </div>
        </div>
      </div>
    </PageLayout>
  );
}
