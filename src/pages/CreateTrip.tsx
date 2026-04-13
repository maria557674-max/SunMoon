import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { useAuth } from '../AuthContext';
import { motion } from 'motion/react';
import { Plus, Trash2, Send, Image as ImageIcon } from 'lucide-react';

export const CreateTrip: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [itinerary, setItinerary] = useState([{ day: 1, activity: '', location: '' }]);
  const [imageUrl, setImageUrl] = useState('');

  const addDay = () => {
    setItinerary([...itinerary, { day: itinerary.length + 1, activity: '', location: '' }]);
  };

  const removeDay = (index: number) => {
    const newItinerary = itinerary.filter((_, i) => i !== index).map((day, i) => ({ ...day, day: i + 1 }));
    setItinerary(newItinerary);
  };

  const updateDay = (index: number, field: string, value: string) => {
    const newItinerary = [...itinerary];
    (newItinerary[index] as any)[field] = value;
    setItinerary(newItinerary);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const packageData = {
        creatorId: user.uid,
        creatorName: user.displayName,
        title,
        description,
        price: parseFloat(price),
        itinerary,
        images: imageUrl ? [imageUrl] : [],
        status: 'pending',
        averageRating: 0,
        reviewCount: 0,
        createdAt: new Date().toISOString()
      };

      await addDoc(collection(db, 'packages'), packageData);
      navigate('/my-trips');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'packages');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pt-24 pb-12 px-4 max-w-3xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8"
      >
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Your Trip</h1>
        <p className="text-gray-500 mb-8">Share your expertise and earn by creating unique travel experiences.</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">Trip Title</label>
            <input
              required
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., 7 Days in Hidden Bali"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">Price (USD)</label>
              <input
                required
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="999"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">Main Image URL</label>
              <div className="relative">
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-4 py-3 pl-10 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                />
                <ImageIcon className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">Description</label>
            <textarea
              required
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what makes this trip special..."
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all resize-none"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <label className="block text-sm font-bold text-gray-700 uppercase tracking-wider">Itinerary</label>
              <button
                type="button"
                onClick={addDay}
                className="flex items-center space-x-1 text-orange-500 text-sm font-bold hover:text-orange-600"
              >
                <Plus className="w-4 h-4" />
                <span>Add Day</span>
              </button>
            </div>
            
            <div className="space-y-4">
              {itinerary.map((day, index) => (
                <motion.div 
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="p-4 bg-gray-50 rounded-2xl border border-gray-100 relative group"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-black text-gray-400 uppercase">Day {day.day}</span>
                    {itinerary.length > 1 && (
                      <button 
                        type="button" 
                        onClick={() => removeDay(index)}
                        className="text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                    <input
                      required
                      type="text"
                      placeholder="Location"
                      value={day.location}
                      onChange={(e) => updateDay(index, 'location', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:border-orange-500"
                    />
                    <input
                      required
                      type="text"
                      placeholder="What will you do?"
                      value={day.activity}
                      onChange={(e) => updateDay(index, 'activity', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:border-orange-500"
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          <button
            disabled={loading}
            type="submit"
            className="w-full py-4 bg-orange-500 text-white rounded-2xl font-bold text-lg shadow-lg shadow-orange-200 hover:bg-orange-600 hover:shadow-orange-300 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            {loading ? (
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <Send className="w-5 h-5" />
                <span>Submit for Review</span>
              </>
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
};
