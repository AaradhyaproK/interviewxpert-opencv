import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { doc, updateDoc, increment, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useNavigate } from 'react-router-dom';

const Payment: React.FC = () => {
  const { user, userProfile, refreshProfile } = useAuth();
  const [amount, setAmount] = useState(100);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Load Razorpay Script
  const loadRazorpay = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    
    // ------------------------------------------------------------------
    // PAYMENT GATEWAY SETUP (Razorpay)
    // ------------------------------------------------------------------
    
    const res = await loadRazorpay();

    if (!res) {
      alert('Razorpay SDK failed to load. Are you online?');
      setLoading(false);
      return;
    }

    // TODO: Replace with actual backend call to create order if needed
    // const data = await fetch('/api/payment/create-order', { method: 'POST' }).then((t) => t.json());
    
    const options = {
      key: "YOUR_RAZORPAY_KEY_ID", // <--- ENTER YOUR KEY HERE
      amount: amount * 100, // Amount in paise
      currency: "INR",
      name: "InterviewXpert",
      description: "Wallet Recharge",
      image: "https://i.ibb.co/3y9DKsB6/Yellow-and-Black-Illustrative-Education-Logo-1.png",
      // order_id: data.id, // Order ID from backend
      handler: async function (response: any) {
        // Payment Success Handler
        try {
          const userRef = doc(db, 'users', user.uid);
          await updateDoc(userRef, {
            walletBalance: increment(amount)
          });

          // Record Transaction
          await addDoc(collection(db, 'transactions'), {
            userId: user.uid,
            userName: userProfile?.fullname || user.displayName || 'Unknown',
            userEmail: user.email || 'Unknown',
            amount: amount,
            currency: 'INR',
            type: 'credit_purchase',
            status: 'success',
            paymentId: response.razorpay_payment_id || 'unknown',
            createdAt: serverTimestamp()
          });

          await refreshProfile(); 
          alert(`Payment Successful! Added ${amount} points to your wallet.`);
          navigate('/candidate/mock-interview');
        } catch (error) {
          console.error("Payment failed", error);
          alert("Payment failed. Please try again.");
        } finally {
          setLoading(false);
        }
      },
      prefill: {
        name: userProfile?.fullname || user.displayName || "",
        email: user.email || "",
        contact: (userProfile as any)?.phone || ""
      },
      notes: {
        address: "InterviewXpert Corporate Office"
      },
      theme: {
        color: "#3B82F6"
      }
    };

    // If key is present, open Razorpay, else simulate for dev
    if (options.key !== "YOUR_RAZORPAY_KEY_ID") {
        const paymentObject = new (window as any).Razorpay(options);
        paymentObject.on('payment.failed', function (response: any){
            alert(response.error.description);
            setLoading(false);
        });
        paymentObject.open();
    } else {
        // Simulation Fallback (Remove this else block when key is added)
        console.warn("Razorpay Key missing. Simulating payment...");
        await new Promise(resolve => setTimeout(resolve, 2000));
        try {
          const userRef = doc(db, 'users', user.uid);
          await updateDoc(userRef, {
            walletBalance: increment(amount)
          });

          // Record Transaction (Simulation)
          await addDoc(collection(db, 'transactions'), {
            userId: user.uid,
            userName: userProfile?.fullname || user.displayName || 'Unknown',
            userEmail: user.email || 'Unknown',
            amount: amount,
            currency: 'INR',
            type: 'credit_purchase',
            status: 'success',
            paymentId: 'simulated_' + Date.now(),
            createdAt: serverTimestamp()
          });

          await refreshProfile(); 
          alert(`Payment Successful! Added ${amount} points to your wallet.`);
          navigate('/candidate/mock-interview');
        } catch (error) {
          console.error("Payment failed", error);
          alert("Payment failed. Please try again.");
        } finally {
          setLoading(false);
        }
    }
  };

  const predefinedAmounts = [50, 100, 200, 500];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-transparent flex flex-col md:justify-center items-center p-0 md:p-4">
      {/* Mobile Header */}
      <div className="w-full md:hidden flex items-center p-4 bg-transparent border-b border-gray-100 dark:border-slate-800 sticky top-0 z-10">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-gray-600 dark:text-slate-300">
          <i className="fas fa-arrow-left text-lg"></i>
        </button>
        <h1 className="text-lg font-bold text-gray-800 dark:text-white ml-2">Wallet Recharge</h1>
      </div>

      <div className="w-full max-w-md overflow-hidden flex flex-col h-full md:h-auto">
        
        {/* Wallet Card Section */}
        <div className="relative p-6 bg-gradient-to-br from-blue-600 to-indigo-700 text-white overflow-hidden shrink-0 md:rounded-3xl shadow-xl">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <i className="fas fa-wallet text-9xl"></i>
          </div>
          <div className="relative z-10">
            <p className="text-blue-100 text-sm font-medium mb-1">Current Balance</p>
            <h2 className="text-4xl font-bold mb-6">{(userProfile as any)?.walletBalance || 0} <span className="text-lg font-normal opacity-80">pts</span></h2>
            <div className="flex items-center justify-between text-xs text-blue-200 uppercase tracking-wider">
              <span>InterviewXpert Wallet</span>
              <span>1 Point = ₹1</span>
            </div>
          </div>
        </div>

        <div className="p-6 flex-1 flex flex-col">
          <label className="text-sm font-semibold text-gray-500 dark:text-slate-400 mb-4 block">Enter Amount</label>
          
          <div className="relative mb-8">
            <span className="absolute left-0 top-1/2 -translate-y-1/2 text-3xl font-bold text-gray-400 dark:text-slate-600">₹</span>
            <input 
              type="number" 
              inputMode="numeric"
              min="10"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="w-full pl-8 py-2 bg-transparent border-b-2 border-gray-200 dark:border-slate-700 text-4xl font-bold text-gray-800 dark:text-white focus:border-blue-500 focus:outline-none transition-colors placeholder-gray-300"
              placeholder="0"
            />
          </div>

          <div className="grid grid-cols-4 gap-3 mb-8">
            {predefinedAmounts.map((amt) => (
              <button
                key={amt}
                onClick={() => setAmount(amt)}
                className={`py-2 px-1 rounded-xl text-sm font-bold transition-all border ${
                  amount === amt 
                    ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-500 text-blue-600 dark:text-blue-400' 
                    : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-400 hover:border-blue-300'
                }`}
              >
                +₹{amt}
              </button>
            ))}
          </div>

          <div className="mt-auto">
            <div className="flex justify-between items-center mb-4 text-sm">
              <span className="text-gray-500 dark:text-slate-400">You will receive</span>
              <span className="font-bold text-gray-800 dark:text-white">{amount} Points</span>
            </div>
            
            <button 
              onClick={handlePayment}
              disabled={loading || amount < 1}
              className="w-full py-4 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white rounded-2xl font-bold text-lg shadow-lg shadow-blue-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <><i className="fas fa-circle-notch fa-spin"></i> Processing...</>
              ) : (
                <>Pay Securely <i className="fas fa-arrow-right ml-1 text-sm"></i></>
              )}
            </button>
            
            <p className="text-center text-xs text-gray-400 dark:text-slate-500 mt-4 flex items-center justify-center gap-1">
              <i className="fas fa-lock"></i> Secured by Razorpay
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Payment;