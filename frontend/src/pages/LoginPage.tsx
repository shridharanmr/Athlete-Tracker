import React, { useState, useEffect, FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
    Trophy,
    Users,
    TrendingUp,
    CreditCard,
    Bell,
    Eye,
    EyeOff,
    AlertCircle,
    Rocket,
    ArrowRight,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { authAPI } from "../services/api";
import { UserRole } from "../types";
import "./LoginPage.css";

const FEATURES = [
    {
        icon: Users,
        label: "Athlete Management",
        desc: "Track every athlete in one place",
    },
    {
        icon: TrendingUp,
        label: "Performance Analytics",
        desc: "Data-driven training insights",
    },
    {
        icon: CreditCard,
        label: "Fee Management",
        desc: "Automated billing & receipts",
    },
    {
        icon: Bell,
        label: "Real-Time Alerts",
        desc: "Instant notifications & updates",
    },
];

export default function LoginPage() {
    const { login } = useAuth();
    const navigate = useNavigate();

    const [form, setForm] = useState({ username: "", password: "" });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPw, setShowPw] = useState(false);
    const [isFirstTime, setIsFirstTime] = useState(false);

    useEffect(() => {
        authAPI
            .getSetupStatus()
            .then(({ data }) => setIsFirstTime(data.data.isFirstTimeSetup))
            .catch(() => {});
    }, []);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!form.username || !form.password) {
            setError("Please enter both username and password.");
            return;
        }
        setLoading(true);
        setError("");
        try {
            const user = await login(form.username, form.password);
            navigate(
                user.role === UserRole.Athlete ? "/profile" : "/dashboard",
                { replace: true },
            );
        } catch (err: unknown) {
            const msg = (err as { response?: { data?: { message?: string } } })
                ?.response?.data?.message;
            setError(msg || "Login failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex">
            {/* ── Left panel ── */}
            <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700 flex-col justify-between p-12">
                {/* decorative circles */}
                <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-white/5" />
                <div className="absolute -bottom-32 -right-32 w-[500px] h-[500px] rounded-full bg-white/5" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-white/5" />

                {/* brand */}
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-10">
                        <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center">
                            <Trophy size={26} className="text-white" />
                        </div>
                        <span className="text-white text-2xl font-bold tracking-tight">
                            Smart Athlete
                        </span>
                    </div>

                    <h2 className="text-4xl font-extrabold text-white leading-tight mb-4">
                        Elevate every
                        <br />
                        athlete's journey
                    </h2>
                    <p className="text-blue-100 text-base leading-relaxed max-w-sm">
                        "Don't measure yourself by what you have accomplished,
                        but by what you could have achieved with your ability."
                    </p>
                </div>

                {/* features */}
                <div className="relative z-10 grid grid-cols-2 gap-4">
                    {FEATURES.map(({ icon: Icon, label, desc }) => (
                        <div
                            key={label}
                            className="bg-white/10 backdrop-blur rounded-2xl p-4 border border-white/10"
                        >
                            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center mb-3">
                                <Icon size={18} className="text-white" />
                            </div>
                            <p className="text-white font-semibold text-sm">
                                {label}
                            </p>
                            <p className="text-blue-200 text-xs mt-0.5">
                                {desc}
                            </p>
                        </div>
                    ))}
                </div>

                {/* bottom quote */}
                <div className="relative z-10 flex items-center gap-3 mt-6">
                    <div className="flex -space-x-2">
                        {["A", "C", "M"].map((l) => (
                            <div
                                key={l}
                                className="w-8 h-8 rounded-full bg-white/30 border-2 border-white/50 flex items-center justify-center text-white text-xs font-bold"
                            >
                                {l}
                            </div>
                        ))}
                    </div>
                    <p className="text-blue-100 text-xs">
                        Trusted by coaches & athletes worldwide
                    </p>
                </div>
            </div>

            {/* ── Right panel ── */}
            <div className="flex-1 flex items-center justify-center p-6 bg-slate-50">
                <div className="w-full max-w-md">
                    {/* mobile logo */}
                    <div className="flex lg:hidden items-center gap-2 mb-8 justify-center">
                        <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
                            <Trophy size={20} className="text-white" />
                        </div>
                        <span className="text-slate-800 text-xl font-bold">
                            Smart Athlete
                        </span>
                    </div>

                    <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/60 p-8 border border-slate-100">
                        <div className="mb-7">
                            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                                Welcome back
                            </h1>
                            <p className="text-slate-500 text-sm mt-1">
                                Sign in to your account to continue
                            </p>
                        </div>

                        {error && (
                            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 mb-5 text-sm">
                                <AlertCircle size={15} className="shrink-0" />
                                {error}
                            </div>
                        )}

                        <form
                            onSubmit={handleSubmit}
                            noValidate
                            className="space-y-5"
                        >
                            {/* username */}
                            <div>
                                <label
                                    className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5"
                                    htmlFor="username"
                                >
                                    Username
                                </label>
                                <input
                                    id="username"
                                    type="text"
                                    autoFocus
                                    autoComplete="username"
                                    placeholder="Enter your username"
                                    value={form.username}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            username: e.target.value,
                                        })
                                    }
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                                />
                            </div>

                            {/* password */}
                            <div>
                                <div className="flex justify-between items-center mb-1.5">
                                    <label
                                        className="block text-xs font-semibold text-slate-600 uppercase tracking-wider"
                                        htmlFor="password"
                                    >
                                        Password
                                    </label>
                                    <Link
                                        to="/forgot-password"
                                        className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                                    >
                                        Forgot password?
                                    </Link>
                                </div>
                                <div className="relative">
                                    <input
                                        id="password"
                                        type={showPw ? "text" : "password"}
                                        autoComplete="current-password"
                                        placeholder="Enter your password"
                                        value={form.password}
                                        onChange={(e) =>
                                            setForm({
                                                ...form,
                                                password: e.target.value,
                                            })
                                        }
                                        className="w-full px-4 py-2.5 pr-11 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPw(!showPw)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                                    >
                                        {showPw ? (
                                            <EyeOff size={16} />
                                        ) : (
                                            <Eye size={16} />
                                        )}
                                    </button>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-xl transition-all duration-200 shadow-md shadow-blue-200 hover:shadow-lg hover:shadow-blue-300 hover:-translate-y-0.5 text-sm"
                            >
                                {loading ? (
                                    <>
                                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />{" "}
                                        Signing in...
                                    </>
                                ) : (
                                    <>
                                        {" "}
                                        Sign In <ArrowRight size={15} />
                                    </>
                                )}
                            </button>
                        </form>

                        <p className="text-center text-sm text-slate-500 mt-5">
                            Don't have an account?{" "}
                            <Link to="/register" className="text-blue-600 font-semibold hover:underline">
                                Sign up
                            </Link>
                        </p>

                        {isFirstTime && (
                            <div className="mt-3 flex items-center justify-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm">
                                <Rocket size={14} className="text-amber-600 shrink-0" />
                                <span className="text-amber-700">First time here?{" "}</span>
                                <Link to="/register" className="text-blue-600 font-semibold hover:underline">
                                    Set up admin account
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
