import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, where, orderBy, getDocs, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { motion, AnimatePresence } from 'motion/react';
import { MapPin, Star, ArrowRight, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatCurrency } from '../lib/utils';
import { useAuth } from '../AuthContext';
import { getTravelRecommendations } from '../lib/recommendationService';

export const Home: React.FC = () => {
  const { user, profile } = useAuth();
  const [packages, setPackages] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [recLoading, setRecLoading] = useState(false);

  useEffect(() => {
    const q = query(
      collection(db, 'packages'),
      where('status', '==', 'approved')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const pkgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPackages(pkgs);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching packages", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchRecs = async () => {
      if (!user || packages.length === 0) return;
      
      setRecLoading(true);
      try {
        // Fetch view history
        const viewQ = query(
          collection(db, 'viewLogs'),
          where('userId', '==', user.uid),
          orderBy('timestamp', 'desc'),
          limit(10)
        );
        const viewSnap = await getDocs(viewQ);
        const viewHistory = viewSnap.docs.map(d => d.data());

        // Fetch booking history
        const bookingQ = query(
          collection(db, 'bookings'),
          where('userId', '==', user.uid)
        );
        const bookingSnap = await getDocs(bookingQ);
        const bookingHistory = bookingSnap.docs.map(d => d.data());

        const recs = await getTravelRecommendations(
          profile?.preferences || {},
          viewHistory,
          bookingHistory,
          packages
        );
        setRecommendations(recs);
      } catch (err) {
        console.error("Error fetching recommendations", err);
      } finally {
        setRecLoading(false);
      }
    };

    fetchRecs();
  }, [user, packages, profile]);

  return (
    <div className="pt-24 pb-12 px-4 max-w-7xl mx-auto">
      <header className="mb-12 text-center">
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-5xl md:text-7xl font-bold text-gray-900 mb-6 tracking-tight"
        >
          Discover Your Next <span className="text-orange-500 italic">Adventure</span>
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-xl text-gray-600 max-w-2xl mx-auto"
        >
          Browse unique travel packages curated by experts and fellow travelers. 
          Or create your own and share it with the world.
        </motion.p>
      </header>

      <AnimatePresence>
        {user && recommendations.length > 0 && (
          <motion.section 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-20"
          >
            <div className="flex items-center space-x-2 mb-8">
              <div className="p-2 bg-orange-100 rounded-xl">
                <Sparkles className="w-5 h-5 text-orange-600" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900">For You</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {recommendations.map((pkg, index) => (
                <motion.div
                  key={`rec-${pkg.id}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="group relative bg-gray-900 rounded-3xl overflow-hidden aspect-[4/5] shadow-2xl"
                >
                  <img 
                    src={pkg.images?.[0] || `https://picsum.photos/seed/${pkg.id}/800/1000`} 
                    className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:scale-110 transition-transform duration-700"
                    alt=""
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-8">
                    <div className="flex items-center space-x-2 mb-3">
                      <span className="px-3 py-1 bg-orange-500 text-white text-[10px] font-black uppercase tracking-widest rounded-full">
                        Recommended
                      </span>
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">{pkg.title}</h3>
                    <p className="text-gray-300 text-sm line-clamp-2 mb-6">{pkg.description}</p>
                    <Link 
                      to={`/package/${pkg.id}`}
                      className="inline-flex items-center space-x-2 text-white font-bold group/link"
                    >
                      <span>Explore Now</span>
                      <ArrowRight className="w-4 h-4 group-hover/link:translate-x-1 transition-transform" />
                    </Link>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      <div className="flex items-center justify-between mb-8">
        <h2 className="text-3xl font-bold text-gray-900">All Packages</h2>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {packages.length > 0 ? (
            packages.map((pkg, index) => (
              <motion.div
                key={pkg.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                className="group bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300"
              >
                <div className="relative h-64 overflow-hidden">
                  <img 
                    src={pkg.images?.[0] || `https://picsum.photos/seed/${pkg.id}/800/600`} 
                    alt={pkg.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-sm font-bold text-gray-900">
                    {formatCurrency(pkg.price)}
                  </div>
                </div>
                <div className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xl font-bold text-gray-900 truncate">{pkg.title}</h3>
                    <div className="flex items-center text-orange-500">
                      <Star className="w-4 h-4 fill-current" />
                      <span className="ml-1 text-sm font-bold">{pkg.averageRating || 'New'}</span>
                    </div>
                  </div>
                  <p className="text-gray-600 text-sm line-clamp-2 mb-6">
                    {pkg.description}
                  </p>
                  <Link 
                    to={`/package/${pkg.id}`}
                    className="flex items-center justify-between w-full py-3 px-6 bg-gray-50 rounded-2xl text-gray-900 font-semibold group-hover:bg-orange-500 group-hover:text-white transition-colors"
                  >
                    <span>View Details</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="col-span-full text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
              <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900">No packages found</h3>
              <p className="text-gray-500">Be the first to create a unique travel experience!</p>
              <Link to="/create" className="mt-6 inline-block bg-orange-500 text-white px-8 py-3 rounded-full font-bold hover:bg-orange-600 transition-colors">
                Create Your Trip
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
