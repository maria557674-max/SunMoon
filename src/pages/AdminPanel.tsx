import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, where, doc, updateDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { useAuth } from '../AuthContext';
import { motion } from 'motion/react';
import { CheckCircle, XCircle, Clock, Shield } from 'lucide-react';
import { formatCurrency } from '../lib/utils';

export const AdminPanel: React.FC = () => {
  const { isAdmin } = useAuth();
  const [pendingPackages, setPendingPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAdmin) return;

    const q = query(collection(db, 'packages'), where('status', '==', 'pending'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setPendingPackages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });

    return () => unsubscribe();
  }, [isAdmin]);

  const handleStatus = async (id: string, status: 'approved' | 'rejected') => {
    try {
      await updateDoc(doc(db, 'packages', id), { status });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `packages/${id}`);
    }
  };

  if (!isAdmin) {
    return (
      <div className="pt-32 text-center">
        <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
        <p className="text-gray-600">You do not have administrative privileges.</p>
      </div>
    );
  }

  return (
    <div className="pt-24 pb-12 px-4 max-w-5xl mx-auto">
      <div className="flex items-center space-x-3 mb-8">
        <div className="p-3 bg-red-100 rounded-2xl">
          <Shield className="w-6 h-6 text-red-600" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Review Panel</h1>
          <p className="text-gray-500">Review and approve user-generated travel packages.</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="space-y-6">
          {pendingPackages.length > 0 ? (
            pendingPackages.map((pkg) => (
              <motion.div
                key={pkg.id}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 flex flex-col md:flex-row gap-6"
              >
                <div className="w-full md:w-48 h-32 rounded-2xl overflow-hidden flex-shrink-0">
                  <img 
                    src={pkg.images?.[0] || `https://picsum.photos/seed/${pkg.id}/400/300`} 
                    alt="" 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="flex-grow">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">{pkg.title}</h3>
                      <p className="text-sm text-gray-500">By {pkg.creatorName || 'Unknown User'}</p>
                    </div>
                    <span className="text-lg font-black text-gray-900">{formatCurrency(pkg.price)}</span>
                  </div>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">{pkg.description}</p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {pkg.itinerary?.map((day: any, i: number) => (
                      <span key={i} className="px-2 py-1 bg-gray-100 rounded-lg text-[10px] font-bold text-gray-500 uppercase">
                        Day {day.day}: {day.location}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex md:flex-col gap-2 justify-center">
                  <button
                    onClick={() => handleStatus(pkg.id, 'approved')}
                    className="flex-1 md:flex-none p-3 bg-green-50 text-green-600 rounded-2xl hover:bg-green-600 hover:text-white transition-all flex items-center justify-center space-x-2"
                  >
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-bold text-sm">Approve</span>
                  </button>
                  <button
                    onClick={() => handleStatus(pkg.id, 'rejected')}
                    className="flex-1 md:flex-none p-3 bg-red-50 text-red-600 rounded-2xl hover:bg-red-600 hover:text-white transition-all flex items-center justify-center space-x-2"
                  >
                    <XCircle className="w-5 h-5" />
                    <span className="font-bold text-sm">Reject</span>
                  </button>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
              <Clock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900">No pending reviews</h3>
              <p className="text-gray-500">All user packages have been processed.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
