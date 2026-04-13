import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../AuthContext';
import { motion } from 'motion/react';
import { Package, Clock, CheckCircle, XCircle } from 'lucide-react';
import { formatCurrency } from '../lib/utils';

export const MyTrips: React.FC = () => {
  const { user } = useAuth();
  const [myPackages, setMyPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const q = query(collection(db, 'packages'), where('creatorId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMyPackages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'rejected': return <XCircle className="w-4 h-4 text-red-500" />;
      default: return <Clock className="w-4 h-4 text-orange-500" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'approved': return 'Approved';
      case 'rejected': return 'Rejected';
      default: return 'Pending Review';
    }
  };

  return (
    <div className="pt-24 pb-12 px-4 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">My Created Trips</h1>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {myPackages.length > 0 ? (
            myPackages.map((pkg) => (
              <motion.div
                key={pkg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 flex flex-col md:flex-row gap-6 items-center"
              >
                <div className="w-full md:w-40 h-28 rounded-2xl overflow-hidden flex-shrink-0">
                  <img 
                    src={pkg.images?.[0] || `https://picsum.photos/seed/${pkg.id}/400/300`} 
                    alt="" 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="flex-grow text-center md:text-left">
                  <h3 className="text-xl font-bold text-gray-900 mb-1">{pkg.title}</h3>
                  <p className="text-gray-500 text-sm mb-4">{formatCurrency(pkg.price)}</p>
                  <div className="flex items-center justify-center md:justify-start space-x-2">
                    {getStatusIcon(pkg.status)}
                    <span className={cn(
                      "text-xs font-bold uppercase tracking-wider",
                      pkg.status === 'approved' ? 'text-green-600' : 
                      pkg.status === 'rejected' ? 'text-red-600' : 'text-orange-600'
                    )}>
                      {getStatusLabel(pkg.status)}
                    </span>
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <span className="text-xs text-gray-400 font-medium">Created {new Date(pkg.createdAt).toLocaleDateString()}</span>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
              <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900">No trips created yet</h3>
              <p className="text-gray-500">Start your journey as a travel creator today.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

import { cn } from '../lib/utils';
