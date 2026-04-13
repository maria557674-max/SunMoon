import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, query, where, orderBy, onSnapshot, addDoc, updateDoc, increment, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { useAuth } from '../AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { Star, MapPin, Calendar, User, Send, ArrowLeft, CheckCircle } from 'lucide-react';
import { formatCurrency, cn } from '../lib/utils';

export const PackageDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [pkg, setPkg] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewText, setReviewText] = useState('');
  const [rating, setRating] = useState(5);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!id) return;

    const pkgRef = doc(db, 'packages', id);
    const unsubscribePkg = onSnapshot(pkgRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.id ? { id: docSnap.id, ...docSnap.data() } : docSnap.data();
        setPkg(data);
        
        // Log view
        if (user) {
          addDoc(collection(db, 'viewLogs'), {
            userId: user.uid,
            targetId: id,
            targetType: 'package',
            timestamp: new Date().toISOString()
          }).catch(err => console.error("Error logging view", err));
        }
      } else {
        navigate('/');
      }
      setLoading(false);
    });

    const reviewsQuery = query(
      collection(db, 'reviews'),
      where('targetId', '==', id),
      orderBy('timestamp', 'desc')
    );
    const unsubscribeReviews = onSnapshot(reviewsQuery, (snapshot) => {
      setReviews(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubscribePkg();
      unsubscribeReviews();
    };
  }, [id, navigate]);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !id || !pkg) return;

    setSubmitting(true);
    try {
      const reviewData = {
        userId: user.uid,
        userName: user.displayName || 'Anonymous',
        userPhoto: user.photoURL,
        targetId: id,
        targetType: 'package',
        rating,
        comment: reviewText,
        timestamp: new Date().toISOString()
      };

      await addDoc(collection(db, 'reviews'), reviewData);

      // Update package rating (simple client-side calculation for demo)
      const newReviewCount = (pkg.reviewCount || 0) + 1;
      const newAverageRating = ((pkg.averageRating || 0) * (pkg.reviewCount || 0) + rating) / newReviewCount;

      await updateDoc(doc(db, 'packages', id), {
        reviewCount: newReviewCount,
        averageRating: Number(newAverageRating.toFixed(1))
      });

      setReviewText('');
      setRating(5);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'reviews');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  if (!pkg) return null;

  return (
    <div className="pt-24 pb-20 px-4 max-w-5xl mx-auto">
      <button 
        onClick={() => navigate(-1)}
        className="flex items-center space-x-2 text-gray-500 hover:text-gray-900 mb-8 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="font-medium">Back</span>
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="relative h-[400px] rounded-3xl overflow-hidden mb-8 shadow-2xl">
              <img 
                src={pkg.images?.[0] || `https://picsum.photos/seed/${pkg.id}/1200/800`} 
                alt={pkg.title}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <div className="absolute bottom-8 left-8 right-8 text-white">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="flex items-center bg-orange-500 px-2 py-1 rounded-lg">
                    <Star className="w-3 h-3 fill-current" />
                    <span className="ml-1 text-xs font-bold">{pkg.averageRating || 'New'}</span>
                  </div>
                  <span className="text-sm font-medium opacity-80">{pkg.reviewCount || 0} reviews</span>
                </div>
                <h1 className="text-4xl font-bold mb-2">{pkg.title}</h1>
                <div className="flex items-center space-x-4 opacity-90">
                  <div className="flex items-center space-x-1">
                    <MapPin className="w-4 h-4" />
                    <span className="text-sm">{pkg.itinerary?.[0]?.location}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-4 h-4" />
                    <span className="text-sm">{pkg.itinerary?.length} Days</span>
                  </div>
                </div>
              </div>
            </div>

            <section className="mb-12">
              <h2 className="text-2xl font-bold mb-4">About this trip</h2>
              <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">{pkg.description}</p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold mb-6">Itinerary</h2>
              <div className="space-y-6 relative before:absolute before:left-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-100">
                {pkg.itinerary?.map((day: any, i: number) => (
                  <div key={i} className="relative pl-12">
                    <div className="absolute left-0 top-1 w-8 h-8 bg-white border-2 border-orange-500 rounded-full flex items-center justify-center z-10">
                      <span className="text-xs font-bold text-orange-500">{day.day}</span>
                    </div>
                    <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                      <h3 className="font-bold text-gray-900 mb-1">{day.location}</h3>
                      <p className="text-gray-600 text-sm">{day.activity}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold">Reviews</h2>
                <div className="flex items-center space-x-2">
                  <Star className="w-5 h-5 text-orange-500 fill-current" />
                  <span className="text-xl font-bold">{pkg.averageRating || '0.0'}</span>
                </div>
              </div>

              {user ? (
                <form onSubmit={handleSubmitReview} className="mb-12 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                  <div className="flex items-center space-x-4 mb-6">
                    <img 
                      src={user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`} 
                      className="w-10 h-10 rounded-full"
                      alt=""
                    />
                    <div>
                      <p className="text-sm font-bold">Rate your experience</p>
                      <div className="flex space-x-1 mt-1">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => setRating(s)}
                            className={cn(
                              "transition-colors",
                              s <= rating ? "text-orange-500" : "text-gray-300"
                            )}
                          >
                            <Star className={cn("w-6 h-6", s <= rating && "fill-current")} />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <textarea
                    required
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    placeholder="Share your thoughts about this trip..."
                    className="w-full p-4 rounded-2xl bg-gray-50 border border-gray-100 focus:ring-2 focus:ring-orange-500 outline-none transition-all resize-none mb-4"
                    rows={3}
                  />
                  <button
                    disabled={submitting}
                    type="submit"
                    className="w-full py-3 bg-orange-500 text-white rounded-xl font-bold hover:bg-orange-600 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
                  >
                    {submitting ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Post Review</span>
                      </>
                    )}
                  </button>
                </form>
              ) : (
                <div className="mb-12 p-6 bg-gray-50 rounded-3xl text-center border border-dashed border-gray-200">
                  <p className="text-gray-500 mb-4">Please sign in to leave a review.</p>
                </div>
              )}

              <div className="space-y-6">
                {reviews.length > 0 ? (
                  reviews.map((review) => (
                    <motion.div 
                      key={review.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="p-6 bg-white rounded-2xl border border-gray-50 shadow-sm"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <img 
                            src={review.userPhoto || `https://api.dicebear.com/7.x/avataaars/svg?seed=${review.userId}`} 
                            className="w-8 h-8 rounded-full"
                            alt=""
                          />
                          <div>
                            <p className="text-sm font-bold text-gray-900">{review.userName}</p>
                            <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">
                              {new Date(review.timestamp).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex space-x-0.5">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star 
                              key={s} 
                              className={cn(
                                "w-3 h-3",
                                s <= review.rating ? "text-orange-500 fill-current" : "text-gray-200"
                              )} 
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-gray-600 text-sm leading-relaxed">{review.comment}</p>
                    </motion.div>
                  ))
                ) : (
                  <p className="text-center text-gray-400 py-8 italic">No reviews yet. Be the first to rate!</p>
                )}
              </div>
            </section>
          </motion.div>
        </div>

        <div className="lg:col-span-1">
          <div className="sticky top-24 space-y-6">
            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-xl">
              <div className="flex items-center justify-between mb-6">
                <span className="text-gray-500 font-medium">Price</span>
                <span className="text-3xl font-black text-gray-900">{formatCurrency(pkg.price)}</span>
              </div>
              <button className="w-full py-4 bg-gray-900 text-white rounded-2xl font-bold text-lg hover:bg-gray-800 transition-all shadow-lg mb-4">
                Book This Trip
              </button>
              <p className="text-center text-xs text-gray-400 font-medium">
                Free cancellation up to 48 hours before departure.
              </p>
            </div>

            <div className="bg-orange-50 p-6 rounded-3xl border border-orange-100">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm">
                  <User className="w-5 h-5 text-orange-500" />
                </div>
                <div>
                  <p className="text-xs text-orange-600 font-bold uppercase tracking-wider">Created By</p>
                  <p className="font-bold text-gray-900">{pkg.creatorName || 'Agency Expert'}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2 text-orange-700">
                <CheckCircle className="w-4 h-4" />
                <span className="text-xs font-medium">Verified Travel Creator</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
