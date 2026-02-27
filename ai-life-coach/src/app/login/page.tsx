/** Page Component: Entry giao diện Đăng nhập/Đăng ký. */
'use client';

import { signInWithGoogle, login, signup, loginAsGuest } from './actions';
import { motion } from 'framer-motion';
import { Compass, Mail, Lock, ArrowRight, UserPlus, Zap } from 'lucide-react';
import { use, useState } from 'react';

export default function LoginPage({
    searchParams,
}: {
    searchParams: Promise<{ message: string }>
}) {
    const params = use(searchParams);
    const [isLoginMode, setIsLoginMode] = useState(true);

    return (
        <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-neutral-900">

            <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
            <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
            <div className="absolute bottom-[-20%] left-20 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="relative z-10 w-full max-w-md mx-auto p-8 rounded-3xl liquid-glass shadow-2xl"
            >
                <div className="text-center mb-8">
                    <motion.div
                        initial={{ scale: 0.9 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: 0.5 }}
                        className="w-16 h-16 bg-white/20 rounded-2xl mx-auto flex items-center justify-center border border-white/30 shadow-inner mb-4"
                    >
                        <Compass className="w-8 h-8 text-white" />
                    </motion.div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">AI Life Coach</h1>
                    <p className="text-white/60 mt-2 text-sm">Người đồng hành bền vững của bạn</p>
                </div>

                {params?.message && (
                    <p className="p-4 bg-white/10 text-white text-center rounded-xl border border-white/20 mb-6 text-sm">
                        {params.message}
                    </p>
                )}


                <div className="flex bg-white/5 rounded-xl border border-white/10 p-1 mb-6">
                    <button
                        onClick={() => setIsLoginMode(true)}
                        className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${isLoginMode ? 'bg-indigo-500/80 text-white shadow-md' : 'text-white/60 hover:text-white'
                            }`}
                    >
                        Đăng nhập
                    </button>
                    <button
                        onClick={() => setIsLoginMode(false)}
                        className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${!isLoginMode ? 'bg-indigo-500/80 text-white shadow-md' : 'text-white/60 hover:text-white'
                            }`}
                    >
                        Đăng ký
                    </button>
                </div>


                <form className="space-y-4 mb-6">
                    <div className="space-y-3 flex flex-col">
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <Mail className="h-5 w-5 text-white/50" />
                            </div>
                            <input
                                type="email"
                                name="email"
                                placeholder="Email của bạn"
                                required
                                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 shadow-inner transition-all hover:bg-white/10 outline-none"
                            />
                        </div>

                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <Lock className="h-5 w-5 text-white/50" />
                            </div>
                            <input
                                type="password"
                                name="password"
                                placeholder="Mật khẩu"
                                required
                                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 shadow-inner transition-all hover:bg-white/10 outline-none"
                            />
                        </div>
                    </div>

                    <div className="pt-2">
                        {isLoginMode ? (
                            <button
                                formAction={login}
                                type="submit"
                                className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-medium py-3 px-4 rounded-xl border border-white/20 transition-all duration-300 ease-in-out active:scale-95 shadow-md flex justify-center items-center gap-2"
                            >
                                Vào ngay <ArrowRight className="w-4 h-4" />
                            </button>
                        ) : (
                            <button
                                formAction={signup}
                                type="submit"
                                className="w-full bg-white/20 hover:bg-white/30 text-white font-medium py-3 px-4 rounded-xl border border-white/20 transition-all duration-300 ease-in-out active:scale-95 shadow-md flex justify-center items-center gap-2"
                            >
                                Đăng ký tài khoản <UserPlus className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </form>
                <form action={loginAsGuest} className="mb-6">
                    <button
                        type="submit"
                        className="relative w-full flex items-center justify-center gap-3 bg-white/10 hover:bg-white/20 text-white font-bold py-4 px-4 rounded-xl border-2 border-amber-400/50 backdrop-blur-lg transition-all duration-300 ease-in-out hover:scale-[1.02] active:scale-95 overflow-hidden group shadow-[0_0_30px_rgba(251,191,36,0.25)]"
                    >
                        {/* Shimmer gradient overlay */}
                        <div className="absolute inset-0 bg-gradient-to-r from-amber-500/30 via-orange-500/30 to-rose-500/30 opacity-70 group-hover:opacity-100 transition-opacity" />

                        <Zap className="w-6 h-6 text-amber-300 fill-amber-300/60 relative z-10 animate-pulse" />
                        <span className="relative z-10 tracking-widest text-[14px] sm:text-[15px] uppercase text-amber-50 drop-shadow-lg">
                            TRẢI NGHIỆM CHO GIÁM KHẢO
                        </span>
                    </button>
                </form>

                <div className="relative flex items-center py-2 mb-6">
                    <div className="flex-grow border-t border-white/10"></div>
                    <span className="flex-shrink-0 mx-4 text-white/40 text-xs">Hoặc</span>
                    <div className="flex-grow border-t border-white/10"></div>
                </div>


                <div className="space-y-4">
                    <button
                        onClick={() => signInWithGoogle()}
                        className="w-full flex items-center justify-center gap-3 bg-white/5 hover:bg-white/10 text-white/80 font-medium py-3 px-4 rounded-xl border border-white/10 transition-all duration-300 ease-in-out active:scale-95 shadow-sm"
                    >
                        <svg className="w-5 h-5 opacity-80" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                        </svg>
                        Google
                    </button>
                </div>

                <div className="mt-8 text-center text-xs text-white/40">
                    <p>By continuing, you agree to our Terms of Service</p>
                </div>
            </motion.div>
        </div >
    );
}
