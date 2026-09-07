import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from 'react';
import { Activity, AlertTriangle, ArrowLeft, CalendarDays, Camera, ChevronRight, Database, Eye, EyeOff, Flame, Footprints, HeartPulse, Home, BarChart3, Settings, ChevronDown, ChevronUp, X, LogOut, Mail, MessageSquareText, Pencil, Plus, Ruler, Save, ShieldCheck, Target, Trash2, TrendingDown, UserRound, Utensils, Weight, Zap, } from 'lucide-react';
import { activityOptions, calculateDailyNutrition, calculateWeightPrediction, } from './lib/nutrition.js';
import { calculateAchievementProbability, calculateConditionScore, calculateRollingWeightStats } from './lib/cutline-metrics.js';
const isoToday = () => {
    const now = new Date();
    const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 10);
};
function dateAtNoon(value) {
    return new Date(`${value}T12:00:00`);
}
function daysBetween(start, end) {
    return Math.max(0, Math.ceil((end.getTime() - start.getTime()) / 86400000));
}
function normalizedWaterCut(plan) {
    return Number.isFinite(plan.waterCutKg) ? Math.max(0, Number(plan.waterCutKg)) : 0;
}
function dietTargetWeight(plan) {
    return Math.min(plan.currentWeight, plan.targetWeight + normalizedWaterCut(plan));
}
function weighInDateIso(plan) {
    if (plan.weighInType !== 'day_before')
        return plan.fightDate;
    const date = dateAtNoon(plan.fightDate);
    date.setDate(date.getDate() - 1);
    return date.toISOString().slice(0, 10);
}
function weighInLabel(plan) {
    return plan.weighInType === 'day_before' ? '前日計量' : '当日計量';
}
async function api(path, options) {
    const response = await fetch(`/api/cutline${path}`, {
        headers: { 'Content-Type': 'application/json', ...options?.headers },
        ...options,
    });
    const payload = response.status === 204 ? null : await response.json();
    if (!response.ok)
        throw new Error(payload?.error || '通信エラーが発生しました。');
    return payload;
}
export default function CutlineApp() {
    const [loading, setLoading] = useState(true);
    const [session, setSession] = useState(null);
    const [resetToken, setResetToken] = useState(() => typeof window === 'undefined' ? '' : new URLSearchParams(window.location.search).get('reset') ?? '');
    useEffect(() => {
        api('/session')
            .then(setSession)
            .catch(() => setSession(null))
            .finally(() => setLoading(false));
    }, []);
    if (resetToken)
        return _jsx(ResetPasswordScreen, { token: resetToken, onComplete: () => {
                if (typeof window !== 'undefined')
                    window.history.replaceState({}, '', window.location.pathname);
                setResetToken('');
                setSession(null);
                setLoading(false);
            } });
    if (loading)
        return _jsx(LoadingScreen, {});
    if (!session)
        return _jsx(AuthScreen, { onAuthenticated: setSession });
    return _jsx(Dashboard, { initialSession: session, onLogout: () => setSession(null) });
}
function Brand() {
    return (_jsxs("div", { className: "brand", "aria-label": "CUTLINE", children: [_jsx("span", { className: "brand-mark", children: _jsx(TrendingDown, { size: 18, strokeWidth: 3 }) }), _jsxs("span", { children: [_jsx("strong", { children: "CUTLINE" }), _jsx("small", { children: "\u6E1B\u91CF\u30921\u672C\u306E\u7DDA\u306B" })] })] }));
}
function LoadingScreen() {
    return (_jsxs("main", { className: "loading-screen", children: [_jsx(Brand, {}), _jsxs("div", { className: "loading-card", "aria-label": "\u8AAD\u307F\u8FBC\u307F\u4E2D", children: [_jsx("span", {}), _jsx("span", {}), _jsx("span", {})] })] }));
}
function AuthScreen({ onAuthenticated }) {
    const [mode, setMode] = useState('login');
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');
    const [submitting, setSubmitting] = useState(false);
    async function submit(event) {
        event.preventDefault();
        setError('');
        setNotice('');
        setSubmitting(true);
        try {
            if (mode === 'forgot') {
                const result = await api('/forgot-password', {
                    method: 'POST',
                    body: JSON.stringify({ email }),
                });
                setNotice(result.message);
                return;
            }
            const result = await api(mode === 'login' ? '/login' : '/register', {
                method: 'POST',
                body: JSON.stringify({ username, email: mode === 'register' ? email : undefined, password }),
            });
            onAuthenticated(result);
        }
        catch (caught) {
            setError(caught instanceof Error ? caught.message : '処理を完了できませんでした。');
        }
        finally {
            setSubmitting(false);
        }
    }
    function changeMode(nextMode) {
        setMode(nextMode);
        setError('');
        setNotice('');
        setPassword('');
    }
    const forgotMode = mode === 'forgot';
    return (_jsxs("main", { className: "auth-shell", children: [_jsx("div", { className: "ambient ambient-one" }), _jsx("div", { className: "ambient ambient-two" }), _jsxs("div", { className: "auth-wrap", children: [_jsx("header", { children: _jsx(Brand, {}) }), _jsxs("section", { className: "auth-card", children: [_jsxs("div", { className: "auth-copy", children: [_jsx("p", { className: "eyebrow", children: "CUTLINE" }), _jsxs("h1", { children: ["\u6E1B\u91CF\u3092", _jsx("em", { children: "1\u672C\u306E\u7DDA\u306B" })] }), _jsx("p", { children: "\u4F53\u91CD\u30FB\u8A66\u5408\u65E5\u30FB\u98DF\u4E8B\u3092\u307E\u3068\u3081\u3066\u7BA1\u7406\u3057\u3001\u5FC5\u8981\u306A\u6E1B\u91CF\u30DA\u30FC\u30B9\u30681\u65E5\u306E\u6442\u53D6\u76EE\u5B89\u3092\u81EA\u52D5\u8A08\u7B97\u3057\u307E\u3059\u3002" }), _jsxs("div", { className: "auth-points", children: [_jsxs("span", { children: [_jsx(ShieldCheck, { size: 20 }), " \u4ED6\u306E\u30E6\u30FC\u30B6\u30FC\u304B\u3089\u30C7\u30FC\u30BF\u3092\u5206\u96E2"] }), _jsxs("span", { children: [_jsx(Database, { size: 20 }), " \u5225\u306E\u7AEF\u672B\u3067\u3082\u7D9A\u304D\u304B\u3089\u5229\u7528\u53EF\u80FD"] })] })] }), _jsxs("div", { className: "auth-panel", children: [!forgotMode && _jsxs("div", { className: "auth-tabs", role: "tablist", "aria-label": "\u30ED\u30B0\u30A4\u30F3\u65B9\u6CD5", children: [_jsx("button", { type: "button", role: "tab", "aria-selected": mode === 'login', className: mode === 'login' ? 'active' : '', onClick: () => changeMode('login'), children: "\u30ED\u30B0\u30A4\u30F3" }), _jsx("button", { type: "button", role: "tab", "aria-selected": mode === 'register', className: mode === 'register' ? 'active' : '', onClick: () => changeMode('register'), children: "\u65B0\u898F\u767B\u9332" })] }), forgotMode && _jsxs("button", { type: "button", className: "auth-back-button", onClick: () => changeMode('login'), children: [_jsx(ArrowLeft, { size: 16 }), "\u30ED\u30B0\u30A4\u30F3\u306B\u623B\u308B"] }), _jsxs("div", { className: "auth-title", children: [_jsx("h2", { children: mode === 'login' ? 'おかえりなさい' : mode === 'register' ? 'アカウントを作成' : 'パスワードを再設定' }), _jsx("p", { children: mode === 'login' ? '登録した情報でログインしてください。' : mode === 'register' ? 'メールアドレスはパスワード再設定に使用します。' : '登録済みのメールアドレスへ再設定リンクを送ります。' })] }), _jsxs("form", { onSubmit: submit, children: [!forgotMode && _jsxs("label", { children: ["\u30E6\u30FC\u30B6\u30FC\u540D", _jsxs("div", { className: "input-wrap", children: [_jsx(UserRound, { size: 18 }), _jsx("input", { value: username, onChange: (event) => setUsername(event.target.value), autoComplete: "username", placeholder: "\u30E6\u30FC\u30B6\u30FC\u540D\u3092\u5165\u529B", required: true, minLength: 3, maxLength: 30 })] })] }), (mode === 'register' || forgotMode) && _jsxs("label", { children: ["\u30E1\u30FC\u30EB\u30A2\u30C9\u30EC\u30B9", _jsxs("div", { className: "input-wrap", children: [_jsx(Mail, { size: 18 }), _jsx("input", { type: "email", value: email, onChange: (event) => setEmail(event.target.value), autoComplete: "email", placeholder: "name@example.com", required: true, maxLength: 254 })] })] }), !forgotMode && _jsxs("label", { children: ["\u30D1\u30B9\u30EF\u30FC\u30C9", _jsxs("div", { className: "input-wrap", children: [_jsx(ShieldCheck, { size: 18 }), _jsx("input", { type: showPassword ? 'text' : 'password', value: password, onChange: (event) => setPassword(event.target.value), autoComplete: mode === 'login' ? 'current-password' : 'new-password', placeholder: "8\u6587\u5B57\u4EE5\u4E0A", required: true, minLength: 8, maxLength: 128 }), _jsx("button", { type: "button", onClick: () => setShowPassword((value) => !value), "aria-label": showPassword ? 'パスワードを隠す' : 'パスワードを表示', children: showPassword ? _jsx(EyeOff, { size: 18 }) : _jsx(Eye, { size: 18 }) })] })] }), mode === 'login' && _jsx("button", { type: "button", className: "forgot-password-link", onClick: () => changeMode('forgot'), children: "\u30D1\u30B9\u30EF\u30FC\u30C9\u3092\u5FD8\u308C\u305F\u65B9" }), error && _jsx("p", { className: "form-error", role: "alert", children: error }), notice && _jsx("p", { className: "auth-notice", role: "status", children: notice }), _jsxs("button", { className: "primary-button", disabled: submitting, children: [submitting ? '送信中…' : mode === 'login' ? 'ログインする' : mode === 'register' ? '新規登録する' : '再設定メールを送る', _jsx(ChevronRight, { size: 18 })] })] }), _jsxs("p", { className: "security-note", children: [_jsx(ShieldCheck, { size: 15 }), " \u30D1\u30B9\u30EF\u30FC\u30C9\u306F\u6697\u53F7\u5B66\u7684\u30CF\u30C3\u30B7\u30E5\u3067\u4FDD\u8B77\u3055\u308C\u307E\u3059\u3002"] })] })] })] })] }));
}
function ResetPasswordScreen({ token, onComplete }) {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');
    const [submitting, setSubmitting] = useState(false);
    async function submit(event) {
        event.preventDefault();
        setError('');
        setNotice('');
        if (password !== confirmPassword)
            return setError('確認用パスワードが一致しません。');
        setSubmitting(true);
        try {
            const result = await api('/reset-password', {
                method: 'POST',
                body: JSON.stringify({ token, password }),
            });
            setNotice(result.message);
        }
        catch (caught) {
            setError(caught instanceof Error ? caught.message : 'パスワードを変更できませんでした。');
        }
        finally {
            setSubmitting(false);
        }
    }
    return _jsxs("main", { className: "auth-shell", children: [_jsx("div", { className: "ambient ambient-one" }), _jsx("div", { className: "ambient ambient-two" }), _jsxs("div", { className: "auth-wrap reset-auth-wrap", children: [_jsx("header", { children: _jsx(Brand, {}) }), _jsx("section", { className: "auth-card reset-auth-card", children: _jsxs("div", { className: "auth-panel", children: [_jsxs("div", { className: "auth-title", children: [_jsx("h2", { children: "\u65B0\u3057\u3044\u30D1\u30B9\u30EF\u30FC\u30C9\u3092\u8A2D\u5B9A" }), _jsx("p", { children: "8\u6587\u5B57\u4EE5\u4E0A\u306E\u65B0\u3057\u3044\u30D1\u30B9\u30EF\u30FC\u30C9\u3092\u5165\u529B\u3057\u3066\u304F\u3060\u3055\u3044\u3002" })] }), notice ? _jsxs("div", { className: "reset-success", children: [_jsx(ShieldCheck, { size: 28 }), _jsx("p", { children: notice }), _jsx("button", { className: "primary-button", onClick: onComplete, children: "\u30ED\u30B0\u30A4\u30F3\u753B\u9762\u3078" })] }) : _jsxs("form", { onSubmit: submit, children: [_jsxs("label", { children: ["\u65B0\u3057\u3044\u30D1\u30B9\u30EF\u30FC\u30C9", _jsxs("div", { className: "input-wrap", children: [_jsx(ShieldCheck, { size: 18 }), _jsx("input", { type: showPassword ? 'text' : 'password', value: password, onChange: (event) => setPassword(event.target.value), autoComplete: "new-password", placeholder: "8\u6587\u5B57\u4EE5\u4E0A", required: true, minLength: 8, maxLength: 128 }), _jsx("button", { type: "button", onClick: () => setShowPassword((value) => !value), "aria-label": showPassword ? 'パスワードを隠す' : 'パスワードを表示', children: showPassword ? _jsx(EyeOff, { size: 18 }) : _jsx(Eye, { size: 18 }) })] })] }), _jsxs("label", { children: ["\u78BA\u8A8D\u7528\u30D1\u30B9\u30EF\u30FC\u30C9", _jsxs("div", { className: "input-wrap", children: [_jsx(ShieldCheck, { size: 18 }), _jsx("input", { type: showPassword ? 'text' : 'password', value: confirmPassword, onChange: (event) => setConfirmPassword(event.target.value), autoComplete: "new-password", placeholder: "\u3082\u3046\u4E00\u5EA6\u5165\u529B", required: true, minLength: 8, maxLength: 128 })] })] }), error && _jsx("p", { className: "form-error", role: "alert", children: error }), _jsxs("button", { className: "primary-button", disabled: submitting, children: [submitting ? '変更中…' : 'パスワードを変更', _jsx(ChevronRight, { size: 18 })] })] })] }) })] })] });
}
function Dashboard({ initialSession, onLogout }) {
    const [user, setUser] = useState(initialSession.user);
    const [plan, setPlan] = useState(initialSession.plan);
    const [profile, setProfile] = useState(initialSession.profile);
    const [records, setRecords] = useState(initialSession.records ?? []);
    const [meals, setMeals] = useState(initialSession.meals ?? []);
    const [exercises, setExercises] = useState(initialSession.exercises ?? []);
    const [conditions, setConditions] = useState(initialSession.conditions ?? []);
    const [templates, setTemplates] = useState(initialSession.templates ?? []);
    const [notice, setNotice] = useState('');
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState('home');
    const [recordSubTab, setRecordSubTab] = useState('weight');
    const metrics = useMemo(() => plan ? calculateMetrics(plan) : null, [plan]);
    const nutrition = useMemo(() => plan && profile && metrics
        ? calculateDailyNutrition(profile, plan, meals, exercises, isoToday(), metrics.cutDays)
        : null, [plan, profile, meals, exercises, metrics]);
    const prediction = useMemo(() => plan ? calculateWeightPrediction(records, plan, isoToday()) : null, [records, plan]);
    const rollingWeight = useMemo(() => calculateRollingWeightStats(records, isoToday()), [records]);
    const latestCondition = conditions.find((entry) => entry.recordedOn === isoToday()) ?? conditions[0] ?? null;
    const conditionScore = useMemo(() => calculateConditionScore(latestCondition), [latestCondition]);
    async function logout() {
        await api('/logout', { method: 'POST' }).catch(() => undefined);
        onLogout();
    }
    if (!plan || !profile || !metrics) {
        return _jsx(SetupScreen, { user: user, initialPlan: plan, initialProfile: profile, onLogout: logout, onComplete: (savedPlan, savedProfile, firstRecord) => {
                setPlan(savedPlan);
                setProfile(savedProfile);
                if (firstRecord)
                    setRecords((current) => [firstRecord, ...current.filter((record) => record.id !== firstRecord.id && record.recordedOn !== firstRecord.recordedOn)]);
            } });
    }
    async function savePlan() {
        setSaving(true);
        setNotice('');
        try {
            const result = await api('/plan', { method: 'PUT', body: JSON.stringify(plan) });
            setPlan(result.plan);
            setNotice('減量プランを保存しました。');
        }
        catch (caught) {
            setNotice(caught instanceof Error ? caught.message : '保存できませんでした。');
        }
        finally {
            setSaving(false);
        }
    }
    async function updateFightMode(enabled) {
        if (!plan)
            return;
        const previous = plan;
        const next = { ...plan, fightMode: enabled };
        setPlan(next);
        setNotice('');
        try {
            const result = await api('/plan', { method: 'PUT', body: JSON.stringify(next) });
            setPlan(result.plan);
            setNotice(enabled ? '試合モードをONにしました。' : '試合モードをOFFにしました。');
        }
        catch (caught) {
            setPlan(previous);
            setNotice(caught instanceof Error ? caught.message : '試合モードを変更できませんでした。');
        }
    }
    function upsertRecord(record) {
        setRecords((current) => [record, ...current.filter((item) => item.id !== record.id && item.recordedOn !== record.recordedOn)].sort((a, b) => b.recordedOn.localeCompare(a.recordedOn)));
        setPlan((current) => current ? { ...current, currentWeight: record.weight } : current);
    }
    function upsertMeal(meal) {
        setMeals((current) => [meal, ...current.filter((item) => item.id !== meal.id)].sort((a, b) => b.eatenOn.localeCompare(a.eatenOn) || b.id - a.id));
    }
    function navigate(tab, targetId) {
        setActiveTab(tab);
        window.setTimeout(() => {
            if (targetId)
                document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            else
                window.scrollTo({ top: 0, behavior: 'smooth' });
        }, 20);
    }
    const statusShort = metrics.status === 'safe' ? '順調' : metrics.status === 'caution' ? '注意' : '危険';
    const todayMeals = meals.filter((meal) => meal.eatenOn === isoToday());
    const averageIntake = meals.length ? meals.reduce((sum, meal) => sum + meal.calories, 0) / Math.max(1, new Set(meals.map((meal) => meal.eatenOn)).size) : 0;
    const weeklyAverage = rollingWeight.currentAverage ?? plan.currentWeight;
    const weeklyChange = rollingWeight.weeklyChange;
    const achievementProbability = calculateAchievementProbability({ currentWeight: plan.currentWeight, targetWeight: dietTargetWeight(plan), daysRemaining: metrics.cutDays, weeklyRequired: metrics.weekly, prediction, recentSamples: rollingWeight.currentSamples });
    const predictedFightWeight = prediction?.available ? prediction.predictedWeight : null;
    const calorieProgress = nutrition ? Math.min(100, Math.max(0, nutrition.consumed / Math.max(1, nutrition.effectiveTargetCalories) * 100)) : 0;
    const activityLabel = activityOptions.find((option) => option.value === profile?.activityLevel)?.label ?? '—';
    return (_jsxs("main", { className: "app-shell app-redesign mockup-ui", children: [activeTab === 'home' && _jsxs("section", { className: "app-content home-screen v7-home", "aria-label": "\u30DB\u30FC\u30E0", children: [_jsx("div", { className: "home-brand-header", children: _jsx(Brand, {}) }), _jsxs("section", { className: `fight-overview-card ${plan.fightMode ? 'fight-mode-on' : ''}`, children: [_jsxs("div", { className: "fight-overview-top", children: [_jsxs("div", { children: [_jsx("span", { className: "fight-mode-badge", children: plan.fightMode ? 'FIGHT MODE' : 'CUTLINE' }), _jsxs("small", { children: [formatDate(plan.fightDate), "\u307E\u3067"] })] }), _jsxs("button", { className: `fight-mode-switch ${plan.fightMode ? 'active' : ''}`, onClick: () => updateFightMode(!plan.fightMode), "aria-pressed": Boolean(plan.fightMode), children: [_jsx(Zap, { size: 15 }), plan.fightMode ? '試合モード ON' : '試合モード'] })] }), _jsxs("div", { className: "weight-goal-line", children: [_jsxs("strong", { children: [plan.currentWeight.toFixed(1), _jsx("span", { children: "kg" })] }), _jsx(ChevronRight, { size: 28 }), _jsxs("div", { className: "target-weight-stack", children: [_jsxs("strong", { children: [plan.targetWeight.toFixed(1), _jsx("span", { children: "kg" })] }), _jsxs("small", { children: ["\u6C34\u629C\u304D\u4E88\u5B9A ", normalizedWaterCut(plan).toFixed(1), " kg"] })] })] }), _jsxs("div", { className: "fight-countdown", children: [_jsx("small", { children: "\u8A66\u5408\u307E\u3067" }), _jsxs("strong", { children: ["\u3042\u3068 ", metrics.days, _jsx("span", { children: "\u65E5" })] })] }), _jsxs("div", { className: "fight-kpi-grid", children: [_jsxs("button", { onClick: () => { setRecordSubTab('weight'); navigate('record'); }, children: [_jsx("small", { children: "\u9054\u6210\u78BA\u7387" }), _jsxs("strong", { children: [achievementProbability, _jsx("span", { children: "%" })] }), _jsx("em", { children: "\u73FE\u5728\u306E\u8A18\u9332\u304B\u3089\u7B97\u51FA" })] }), _jsxs("button", { onClick: () => { setRecordSubTab('weight'); navigate('record'); }, children: [_jsx("small", { children: "7\u65E5\u5E73\u5747" }), _jsxs("strong", { children: [weeklyAverage.toFixed(1), _jsx("span", { children: "kg" })] }), _jsxs("em", { children: [rollingWeight.currentSamples, "\u4EF6\u306E\u8A18\u9332"] })] }), _jsxs("button", { onClick: () => { setRecordSubTab('weight'); navigate('record'); }, children: [_jsx("small", { children: "\u4ECA\u9031" }), _jsxs("strong", { className: weeklyChange !== null && weeklyChange <= 0 ? 'good' : '', children: [weeklyChange === null ? '—' : `${weeklyChange > 0 ? '+' : '−'}${Math.abs(weeklyChange).toFixed(1)}`, _jsx("span", { children: weeklyChange === null ? '' : 'kg' })] }), _jsx("em", { children: "7\u65E5\u5E73\u5747\u306E\u524D\u9031\u6BD4" })] }), _jsxs("button", { onClick: () => { setRecordSubTab('condition'); navigate('record'); }, children: [_jsx("small", { children: "\u30B3\u30F3\u30C7\u30A3\u30B7\u30E7\u30F3" }), _jsxs("strong", { children: [conditionScore ?? '—', _jsx("span", { children: conditionScore !== null ? '/100' : '' })] }), _jsx("em", { children: latestCondition?.recordedOn === isoToday() ? '今日記録済み' : '今日の記録を追加' })] })] }), _jsxs("div", { className: "weighin-prediction", children: [_jsx(Target, { size: 18 }), _jsxs("div", { children: [_jsxs("small", { children: ["\u8A08\u91CF\u6642\u4E88\u6E2C\uFF08", weighInLabel(plan), "\uFF09"] }), predictedFightWeight !== null ? _jsxs("strong", { children: [Math.max(0, predictedFightWeight - normalizedWaterCut(plan)).toFixed(1), " kg ", _jsxs("span", { children: ["\u76EE\u6A19\u5DEE ", predictedFightWeight - normalizedWaterCut(plan) - plan.targetWeight > 0 ? '+' : '', (predictedFightWeight - normalizedWaterCut(plan) - plan.targetWeight).toFixed(1), " kg"] })] }) : _jsx("strong", { children: "\u4F53\u91CD\u30923\u56DE\u4EE5\u4E0A\u8A18\u9332\u3059\u308B\u3068\u8868\u793A" })] })] })] }), _jsxs("div", { className: `mockup-warning compact ${metrics.status}`, children: [_jsx(AlertTriangle, { size: 18 }), _jsxs("div", { children: [_jsxs("strong", { children: [statusShort, "\uFF1A\u5FC5\u8981\u30DA\u30FC\u30B9 ", metrics.weekly.toFixed(2), " kg/\u9031"] }), _jsx("span", { children: metrics.statusDetail })] })] }), _jsxs("section", { className: "mobile-card graph-card mockup-graph-card v7-graph-card", children: [_jsx("div", { className: "section-title", children: _jsxs("div", { children: [_jsx("h2", { children: "\u4F53\u91CD\u63A8\u79FB" }), _jsx("small", { children: "\u5B9F\u6E2C\u3068\u76EE\u6A19\u30E9\u30A4\u30F3" })] }) }), _jsx(WeightChart, { plan: plan, records: records })] })] }), activeTab === 'record' && _jsxs("section", { className: "app-content tab-screen record-screen", "aria-label": "\u8A18\u9332", children: [_jsxs("div", { className: "mockup-screen-title", children: [_jsx("h1", { children: "\u8A18\u9332" }), _jsx(CalendarDays, { size: 22 })] }), _jsxs("div", { className: "record-segments", role: "tablist", "aria-label": "\u8A18\u9332\u30AB\u30C6\u30B4\u30EA", children: [_jsx("button", { className: recordSubTab === 'weight' ? 'active' : '', onClick: () => setRecordSubTab('weight'), children: "\u4F53\u91CD" }), _jsx("button", { className: recordSubTab === 'condition' ? 'active' : '', onClick: () => setRecordSubTab('condition'), children: "\u4F53\u8ABF" }), _jsx("button", { className: recordSubTab === 'calories' ? 'active' : '', onClick: () => setRecordSubTab('calories'), children: "\u30AB\u30ED\u30EA\u30FC" }), _jsx("button", { className: recordSubTab === 'training' ? 'active' : '', onClick: () => setRecordSubTab('training'), children: "\u904B\u52D5" })] }), recordSubTab === 'weight' && _jsxs(_Fragment, { children: [_jsxs("section", { className: "mobile-card graph-card graph-card-large mockup-graph-card", children: [_jsx("div", { className: "section-title", children: _jsx("div", { children: _jsx("h2", { children: "\u4F53\u91CD\u306E\u63A8\u79FB" }) }) }), _jsx(WeightChart, { plan: plan, records: records })] }), _jsx(RecordPanel, { records: records, onRecordSaved: upsertRecord, onRecordRemoved: (id) => setRecords((current) => current.filter((record) => record.id !== id)), suggestedWeight: plan.currentWeight }), _jsxs("section", { className: "mobile-card compact-section", children: [_jsx("div", { className: "section-title", children: _jsx("div", { children: _jsx("h2", { children: "\u9031\u3054\u3068\u306E\u76EE\u6A19" }) }) }), _jsx("div", { className: "target-list", children: metrics.targets.map((target, index) => _jsxs("div", { className: index === 0 ? 'current' : '', children: [_jsxs("span", { children: [index + 1, "\u9031\u76EE"] }), _jsx("time", { children: formatShortDate(target.date) }), _jsxs("b", { children: [target.weight.toFixed(1), " kg"] })] }, target.date)) })] })] }), recordSubTab === 'condition' && _jsx(ConditionPanel, { conditions: conditions, onSaved: (condition) => setConditions((current) => [condition, ...current.filter((item) => item.id !== condition.id && item.recordedOn !== condition.recordedOn)].sort((a, b) => b.recordedOn.localeCompare(a.recordedOn))), onRemoved: (id) => setConditions((current) => current.filter((item) => item.id !== id)) }), recordSubTab === 'calories' && _jsxs(_Fragment, { children: [_jsxs("div", { className: "analysis-grid mockup-analysis-grid", children: [_jsxs("div", { children: [_jsx(Zap, { size: 19 }), _jsx("small", { children: "BMR" }), _jsxs("strong", { children: [nutrition ? Math.round(nutrition.bmr).toLocaleString() : '—', _jsx("span", { children: " kcal" })] })] }), _jsxs("div", { children: [_jsx(Flame, { size: 19 }), _jsx("small", { children: "TDEE" }), _jsxs("strong", { children: [nutrition ? Math.round(nutrition.tdee).toLocaleString() : '—', _jsx("span", { children: " kcal" })] })] }), _jsxs("div", { children: [_jsx(Target, { size: 19 }), _jsx("small", { children: "\u76EE\u6A19\u6442\u53D6" }), _jsxs("strong", { children: [nutrition ? Math.round(nutrition.targetCalories).toLocaleString() : '—', _jsx("span", { children: " kcal" })] })] }), _jsxs("div", { children: [_jsx(Utensils, { size: 19 }), _jsx("small", { children: "\u5E73\u5747\u6442\u53D6" }), _jsxs("strong", { children: [Math.round(averageIntake).toLocaleString(), _jsx("span", { children: " kcal" })] })] })] }), _jsx(CaloriesPanel, { nutrition: nutrition, profile: profile, prediction: prediction })] }), recordSubTab === 'training' && _jsx(HealthPanel, { exercises: exercises, onExerciseAdded: (exercise) => setExercises((current) => [exercise, ...current]), onExerciseRemoved: (id) => setExercises((current) => current.filter((exercise) => exercise.id !== id)) })] }), activeTab === 'meals' && _jsxs("section", { className: "app-content tab-screen meals-screen", "aria-label": "\u98DF\u4E8B", children: [_jsx("div", { className: "mockup-screen-title centered", children: _jsx("h1", { children: "\u98DF\u4E8B" }) }), _jsxs("section", { className: `meal-summary-card ${nutrition && nutrition.remaining < 0 ? 'over' : ''}`, children: [_jsx("div", { className: "calorie-donut", style: { '--meal-progress': `${calorieProgress * 3.6}deg` }, children: _jsxs("div", { children: [_jsx("strong", { children: Math.round(nutrition?.consumed ?? 0).toLocaleString() }), _jsxs("span", { children: ["/ ", Math.round(nutrition?.effectiveTargetCalories ?? 0).toLocaleString(), " kcal"] })] }) }), _jsxs("div", { className: "remaining-calories", children: [_jsx("small", { children: "\u6B8B\u308A\u30AB\u30ED\u30EA\u30FC" }), _jsxs("strong", { children: [nutrition ? Math.round(nutrition.remaining).toLocaleString() : '—', _jsx("span", { children: "kcal" })] })] }), _jsxs("div", { className: "macro-summary", children: [_jsxs("span", { children: [_jsx("i", { children: "P" }), _jsxs("b", { children: [Math.round(nutrition?.protein ?? 0), " g"] })] }), _jsxs("span", { children: [_jsx("i", { children: "F" }), _jsxs("b", { children: [Math.round(nutrition?.fat ?? 0), " g"] })] }), _jsxs("span", { children: [_jsx("i", { children: "C" }), _jsxs("b", { children: [Math.round(nutrition?.carbs ?? 0), " g"] })] })] })] }), _jsx(MealPanel, { meals: meals, templates: templates, onMealSaved: upsertMeal, onMealRemoved: (id) => setMeals((current) => current.filter((meal) => meal.id !== id)), onTemplateSaved: (template) => setTemplates((current) => [template, ...current]), onTemplateRemoved: (id) => setTemplates((current) => current.filter((template) => template.id !== id)) }), _jsxs("details", { className: "feature-details", children: [_jsxs("summary", { children: [_jsx(Camera, { size: 18 }), "\u5199\u771F\u304B\u3089\u30AB\u30ED\u30EA\u30FC\u63A8\u5B9A", _jsx(ChevronDown, { size: 18 })] }), _jsx(PhotoEstimatePanel, {})] })] }), activeTab === 'settings' && _jsxs("section", { className: "app-content tab-screen settings-screen-page", "aria-label": "\u8A2D\u5B9A", children: [_jsx("div", { className: "mockup-screen-title centered", children: _jsx("h1", { children: "\u8A2D\u5B9A" }) }), _jsxs("section", { className: "settings-profile-card", children: [_jsx("span", { children: user.username.slice(0, 1).toUpperCase() }), _jsxs("div", { children: [_jsx("strong", { children: user.username }), _jsx("small", { children: user.email ?? 'メール未登録' })] }), _jsx(ChevronRight, { size: 19 })] }), _jsx(AccountPanel, { user: user, onUserChanged: setUser }), _jsxs("section", { className: "settings-summary-section", children: [_jsxs("div", { className: "settings-section-head", children: [_jsx("h2", { children: "\u4F53\u306E\u60C5\u5831" }), _jsx("a", { href: "#profile-edit", children: "\u7DE8\u96C6" })] }), _jsxs("div", { className: "settings-info-grid", children: [_jsxs("div", { children: [_jsx("small", { children: "\u6027\u5225" }), _jsx("strong", { children: profile?.sex === 'female' ? '女性' : '男性' })] }), _jsxs("div", { children: [_jsx("small", { children: "\u5E74\u9F62" }), _jsxs("strong", { children: [profile?.age ?? '—', _jsx("span", { children: " \u6B73" })] })] }), _jsxs("div", { children: [_jsx("small", { children: "\u8EAB\u9577" }), _jsxs("strong", { children: [profile?.heightCm ?? '—', _jsx("span", { children: " cm" })] })] }), _jsxs("div", { children: [_jsx("small", { children: "\u73FE\u5728\u4F53\u91CD" }), _jsxs("strong", { children: [plan.currentWeight.toFixed(1), _jsx("span", { children: " kg" })] })] }), _jsxs("div", { children: [_jsx("small", { children: "\u76EE\u6A19\u4F53\u91CD" }), _jsxs("strong", { children: [plan.targetWeight.toFixed(1), _jsx("span", { children: " kg" })] }), _jsxs("small", { className: "water-cut-sub", children: ["\u6C34\u629C\u304D\u4E88\u5B9A ", normalizedWaterCut(plan).toFixed(1), " kg"] })] }), _jsxs("div", { children: [_jsx("small", { children: "\u6D3B\u52D5\u91CF" }), _jsx("strong", { children: activityLabel })] })] })] }), _jsxs("section", { className: "settings-summary-section", children: [_jsxs("div", { className: "settings-section-head", children: [_jsx("h2", { children: "\u8A66\u5408\u60C5\u5831" }), _jsx("a", { href: "#plan-edit", children: "\u7DE8\u96C6" })] }), _jsxs("div", { className: "fight-info-list", children: [_jsxs("div", { children: [_jsxs("span", { children: [_jsx("small", { children: "\u8A66\u5408\u65E5" }), _jsx("strong", { children: formatDate(plan.fightDate) })] }), _jsxs("b", { children: ["\u3042\u3068 ", metrics.days, " \u65E5"] })] }), _jsx("div", { children: _jsxs("span", { children: [_jsx("small", { children: "\u8A08\u91CF" }), _jsxs("strong", { children: [weighInLabel(plan), " / ", formatDate(weighInDateIso(plan))] })] }) }), _jsx("div", { children: _jsxs("span", { children: [_jsx("small", { children: "\u968E\u7D1A / \u76EE\u6A19" }), _jsxs("strong", { children: [plan.targetWeight.toFixed(1), " kg"] })] }) }), _jsx("div", { children: _jsxs("span", { children: [_jsx("small", { children: "\u6C34\u629C\u304D\u4E88\u5B9A" }), _jsxs("strong", { children: [normalizedWaterCut(plan).toFixed(1), " kg"] })] }) }), _jsxs("div", { className: "fight-mode-setting", children: [_jsxs("span", { children: [_jsx("small", { children: "\u8A66\u5408\u30E2\u30FC\u30C9" }), _jsx("strong", { children: plan.fightMode ? 'ON' : 'OFF' })] }), _jsx("button", { className: `mini-toggle ${plan.fightMode ? 'active' : ''}`, onClick: () => updateFightMode(!plan.fightMode), "aria-pressed": Boolean(plan.fightMode), children: _jsx("i", {}) })] })] })] }), _jsxs("section", { className: "settings-summary-section", children: [_jsx("div", { className: "settings-section-head", children: _jsx("h2", { children: "\u30A2\u30D7\u30EA\u8A2D\u5B9A" }) }), _jsxs("div", { className: "settings-list", children: [_jsxs("button", { disabled: true, children: [_jsx(MessageSquareText, { size: 19 }), _jsxs("span", { children: ["\u901A\u77E5\u8A2D\u5B9A", _jsx("small", { children: "\u6E96\u5099\u4E2D" })] }), _jsx(ChevronRight, { size: 18 })] }), _jsxs("button", { disabled: true, children: [_jsx(Activity, { size: 19 }), _jsxs("span", { children: ["\u30C0\u30FC\u30AF\u30E2\u30FC\u30C9", _jsx("small", { children: "\u6E96\u5099\u4E2D" })] }), _jsx("i", { className: "toggle-off" })] }), _jsxs("button", { className: "logout-row", onClick: logout, children: [_jsx(LogOut, { size: 19 }), _jsx("span", { children: "\u30ED\u30B0\u30A2\u30A6\u30C8" })] })] })] }), _jsx("div", { id: "plan-edit", children: _jsxs("section", { className: "panel plan-panel settings-panel-card", children: [_jsx(PanelHeading, { number: "01", title: "\u6E1B\u91CF\u30D7\u30E9\u30F3\u7DE8\u96C6", subtitle: "\u4F53\u91CD\u30FB\u8A66\u5408\u65E5\u30FB\u8A08\u91CF\u65B9\u6CD5\u30FB\u6C34\u629C\u304D\u4E88\u5B9A" }), _jsxs("div", { className: "plan-fields", children: [_jsxs("label", { children: ["\u6700\u65B0\u4F53\u91CD", _jsxs("div", { className: "metric-input", children: [_jsx(Weight, { size: 19 }), _jsx("input", { "aria-label": "\u6700\u65B0\u4F53\u91CD", type: "number", inputMode: "decimal", min: "30", max: "300", step: "0.1", value: plan.currentWeight, onChange: (event) => setPlan({ ...plan, currentWeight: Number(event.target.value) }) }), _jsx("span", { children: "kg" })] })] }), _jsxs("label", { children: ["\u76EE\u6A19\u4F53\u91CD", _jsxs("div", { className: "metric-input", children: [_jsx(Target, { size: 19 }), _jsx("input", { "aria-label": "\u76EE\u6A19\u4F53\u91CD", type: "number", inputMode: "decimal", min: "30", max: "300", step: "0.1", value: plan.targetWeight, onChange: (event) => setPlan({ ...plan, targetWeight: Number(event.target.value) }) }), _jsx("span", { children: "kg" })] })] }), _jsxs("label", { className: "date-field", children: ["\u8A66\u5408\u65E5", _jsxs("div", { className: "metric-input", children: [_jsx(CalendarDays, { size: 19 }), _jsx("input", { "aria-label": "\u8A66\u5408\u65E5", type: "date", min: isoToday(), value: plan.fightDate, onChange: (event) => setPlan({ ...plan, fightDate: event.target.value }) })] })] }), _jsxs("label", { children: ["\u8A08\u91CF\u30BF\u30A4\u30DF\u30F3\u30B0", _jsxs("select", { "aria-label": "\u8A08\u91CF\u30BF\u30A4\u30DF\u30F3\u30B0", value: plan.weighInType ?? 'same_day', onChange: (event) => setPlan({ ...plan, weighInType: event.target.value }), children: [_jsx("option", { value: "same_day", children: "\u5F53\u65E5\u8A08\u91CF" }), _jsx("option", { value: "day_before", children: "\u524D\u65E5\u8A08\u91CF" })] })] }), _jsxs("label", { children: ["\u6C34\u629C\u304D\u4E88\u5B9A", _jsxs("div", { className: "metric-input", children: [_jsx(TrendingDown, { size: 19 }), _jsx("input", { "aria-label": "\u6C34\u629C\u304D\u4E88\u5B9A", type: "number", inputMode: "decimal", min: "0", max: "15", step: "0.1", value: normalizedWaterCut(plan), onChange: (event) => setPlan({ ...plan, waterCutKg: Number(event.target.value) }) }), _jsx("span", { children: "kg" })] })] })] }), _jsxs("button", { className: "save-button", onClick: savePlan, disabled: saving, children: [_jsx(Save, { size: 17 }), saving ? '保存中…' : '変更を保存'] }), notice && _jsx("p", { className: "save-notice", role: "status", children: notice })] }) }), _jsx("div", { id: "profile-edit", children: _jsx(ProfilePanel, { profile: profile, onSaved: setProfile }) }), _jsxs("details", { className: "feature-details settings-feedback", children: [_jsxs("summary", { children: [_jsx(MessageSquareText, { size: 18 }), "\u30D5\u30A3\u30FC\u30C9\u30D0\u30C3\u30AF", _jsx(ChevronDown, { size: 18 })] }), _jsx(FeedbackPanel, {})] }), _jsxs("div", { className: "settings-brand", children: [_jsx(Brand, {}), _jsx("small", { children: "Ver. 1.3.0 / v11" })] }), _jsx("p", { className: "settings-disclaimer", children: "\u57FA\u790E\u4EE3\u8B1D\u30FB\u6D88\u8CBB\u30AB\u30ED\u30EA\u30FC\u30FB\u4F53\u91CD\u4E88\u6E2C\u306F\u53C2\u8003\u5024\u3067\u3059\u3002\u6025\u6FC0\u306A\u6E1B\u91CF\u3084\u6975\u7AEF\u306A\u6442\u53D6\u5236\u9650\u306F\u907F\u3051\u3066\u304F\u3060\u3055\u3044\u3002" })] }), _jsx(BottomNavigation, { activeTab: activeTab, onChange: navigate })] }));
}
const tabItems = [
    { id: 'home', label: 'ホーム', icon: Home },
    { id: 'record', label: '記録', icon: BarChart3 },
    { id: 'meals', label: '食事', icon: Utensils },
    { id: 'settings', label: '設定', icon: Settings },
];
function BottomNavigation({ activeTab, onChange }) {
    return _jsx("nav", { className: "bottom-navigation", "aria-label": "\u4E0B\u90E8\u30E1\u30CB\u30E5\u30FC", children: tabItems.map(({ id, label, icon: Icon }) => _jsxs("button", { className: activeTab === id ? 'active' : '', onClick: () => onChange(id), children: [_jsx(Icon, { size: 21 }), _jsx("span", { children: label })] }, id)) });
}
function AppHeader({ user, onSettings, onLogout }) {
    return _jsxs("header", { className: "app-header new-app-header", children: [_jsx(Brand, {}), onSettings ? _jsx("button", { className: "settings-button", onClick: onSettings, "aria-label": `${user.username}の設定を開く`, children: _jsx(Settings, { size: 22 }) }) : onLogout ? _jsx("button", { className: "settings-button", onClick: onLogout, "aria-label": "\u30ED\u30B0\u30A2\u30A6\u30C8", children: _jsx(LogOut, { size: 21 }) }) : null] });
}
function todayTargetWeight(plan, records) {
    if (!records.length)
        return plan.currentWeight;
    const sorted = [...records].sort((a, b) => a.recordedOn.localeCompare(b.recordedOn));
    const first = sorted[0];
    const start = dateAtNoon(first.recordedOn);
    const today = dateAtNoon(isoToday());
    const fight = dateAtNoon(weighInDateIso(plan));
    const totalDays = Math.max(1, daysBetween(start, fight));
    const elapsed = Math.min(totalDays, daysBetween(start, today));
    const ratio = elapsed / totalDays;
    return first.weight - (first.weight - dietTargetWeight(plan)) * ratio;
}
function SetupScreen({ user, initialPlan, initialProfile, onLogout, onComplete }) {
    const [step, setStep] = useState(1);
    const [currentWeight, setCurrentWeight] = useState(initialPlan ? String(initialPlan.currentWeight) : '');
    const [targetWeight, setTargetWeight] = useState(initialPlan ? String(initialPlan.targetWeight) : '');
    const [fightDate, setFightDate] = useState(initialPlan?.fightDate ?? '');
    const [weighInType, setWeighInType] = useState(initialPlan?.weighInType ?? 'same_day');
    const [waterCutKg, setWaterCutKg] = useState(initialPlan ? String(initialPlan.waterCutKg ?? 0) : '0');
    const [heightCm, setHeightCm] = useState(initialProfile ? String(initialProfile.heightCm) : '');
    const [age, setAge] = useState(initialProfile ? String(initialProfile.age) : '');
    const [sex, setSex] = useState(initialProfile?.sex ?? 'male');
    const [activityLevel, setActivityLevel] = useState(initialProfile?.activityLevel ?? 'moderate');
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);
    function continueToNutrition(event) {
        event.preventDefault();
        setError('');
        const current = Number(currentWeight);
        const target = Number(targetWeight);
        const height = Number(heightCm);
        if (!heightCm || !currentWeight || !targetWeight || !fightDate)
            return setError('身長・現体重・目標体重・試合日を入力してください。');
        if (!(height >= 120 && height <= 230))
            return setError('身長は120〜230cmで入力してください。');
        if (!(current >= 30 && current <= 300) || !(target >= 30 && target <= 300))
            return setError('体重は30〜300kgで入力してください。');
        if (target >= current)
            return setError('目標体重は現在体重より軽く設定してください。');
        const waterCut = Number(waterCutKg);
        if (!(waterCut >= 0 && waterCut <= 15))
            return setError('水抜き予定は0〜15kgで入力してください。');
        if (waterCut > current - target)
            return setError('水抜き予定は現在体重と目標体重の差以内で設定してください。');
        if (fightDate < isoToday())
            return setError('試合日は今日以降の日付を設定してください。');
        if (weighInType === 'day_before' && weighInDateIso({ currentWeight: current, targetWeight: target, fightDate, weighInType, waterCutKg: waterCut }) < isoToday())
            return setError('前日計量日が今日より前になっています。');
        setStep(2);
    }
    async function submit(event) {
        event.preventDefault();
        const plan = { currentWeight: Number(currentWeight), targetWeight: Number(targetWeight), fightDate, weighInType, waterCutKg: Number(waterCutKg) };
        if (!age)
            return setError('年齢を入力してください。');
        setSaving(true);
        setError('');
        try {
            const savedPlan = await api('/plan', { method: 'PUT', body: JSON.stringify(plan) });
            const savedProfile = await api('/profile', { method: 'PUT', body: JSON.stringify({ heightCm: Number(heightCm), age: Number(age), sex, activityLevel }) });
            let firstRecord = null;
            if (!initialPlan) {
                try {
                    const result = await api('/records', { method: 'POST', body: JSON.stringify({ weight: plan.currentWeight, recordedOn: isoToday(), note: '初期設定' }) });
                    firstRecord = result.record;
                }
                catch { }
            }
            onComplete(savedPlan.plan, savedProfile.profile, firstRecord);
        }
        catch (caught) {
            setError(caught instanceof Error ? caught.message : '初期設定を保存できませんでした。');
        }
        finally {
            setSaving(false);
        }
    }
    return _jsxs("main", { className: "app-shell setup-shell", children: [_jsx(AppHeader, { user: user, onLogout: onLogout }), _jsxs("section", { className: "setup-card onboarding-card", children: [_jsxs("div", { className: "setup-intro", children: [_jsx("span", { children: "\u521D\u56DE\u30BB\u30C3\u30C8\u30A2\u30C3\u30D7" }), _jsxs("h1", { children: ["\u6700\u521D\u306B\u3001\u6E1B\u91CF\u306E", _jsx("br", {}), "\u57FA\u6E96\u3092\u8A2D\u5B9A\u3002"] }), _jsx("p", { children: "\u65B0\u898F\u767B\u9332\u5F8C\u306F\u3001\u30DB\u30FC\u30E0\u3078\u9032\u3080\u524D\u306B\u8EAB\u4F53\u60C5\u5831\u3068\u8A66\u5408\u60C5\u5831\u3092\u8A2D\u5B9A\u3057\u307E\u3059\u3002\u73FE\u5728\u4F53\u91CD\u306F\u4ECA\u65E5\u306E\u6700\u521D\u306E\u4F53\u91CD\u8A18\u9332\u306B\u3082\u81EA\u52D5\u4FDD\u5B58\u3055\u308C\u307E\u3059\u3002" }), _jsxs("div", { className: "setup-progress", "aria-label": "\u521D\u671F\u8A2D\u5B9A\u306E\u9032\u884C\u72B6\u6CC1", children: [_jsx("span", { className: step >= 1 ? 'active' : '', children: "1" }), _jsx("i", {}), _jsx("span", { className: step >= 2 ? 'active' : '', children: "2" }), _jsx("small", { children: step === 1 ? '基本設定' : 'カロリー計算設定' })] })] }), step === 1 ? _jsxs("form", { onSubmit: continueToNutrition, children: [_jsxs("div", { className: "setup-form-heading", children: [_jsx("strong", { children: "\u57FA\u672C\u8A2D\u5B9A" }), _jsx("small", { children: "\u30ED\u30B0\u30A4\u30F3\u5F8C\u3001\u307E\u305A\u3053\u306E\u60C5\u5831\u3092\u8A2D\u5B9A\u3057\u307E\u3059" })] }), _jsxs("div", { className: "setup-grid onboarding-primary-grid", children: [_jsxs("label", { children: ["\u8EAB\u9577", _jsxs("div", { className: "metric-input", children: [_jsx(Ruler, { size: 20 }), _jsx("input", { type: "number", inputMode: "decimal", min: "120", max: "230", step: "0.1", value: heightCm, onChange: e => setHeightCm(e.target.value), placeholder: "\u4F8B 164", autoFocus: true, required: true }), _jsx("span", { children: "cm" })] })] }), _jsxs("label", { children: ["\u4F53\u91CD\uFF08\u73FE\u4F53\u91CD\uFF09", _jsxs("div", { className: "metric-input", children: [_jsx(Weight, { size: 20 }), _jsx("input", { type: "number", inputMode: "decimal", min: "30", max: "300", step: "0.1", value: currentWeight, onChange: e => setCurrentWeight(e.target.value), placeholder: "\u4F8B 75.2", required: true }), _jsx("span", { children: "kg" })] })] }), _jsxs("label", { className: "setup-wide", children: ["\u6027\u5225", _jsxs("div", { className: "sex-choice", role: "radiogroup", "aria-label": "\u6027\u5225", children: [_jsx("button", { type: "button", role: "radio", "aria-checked": sex === 'male', className: sex === 'male' ? 'active' : '', onClick: () => setSex('male'), children: "\u7537\u6027" }), _jsx("button", { type: "button", role: "radio", "aria-checked": sex === 'female', className: sex === 'female' ? 'active' : '', onClick: () => setSex('female'), children: "\u5973\u6027" })] })] }), _jsxs("label", { children: ["\u8A66\u5408\u65E5", _jsxs("div", { className: "metric-input", children: [_jsx(CalendarDays, { size: 20 }), _jsx("input", { type: "date", min: isoToday(), value: fightDate, onChange: e => setFightDate(e.target.value), required: true })] })] }), _jsxs("label", { children: ["\u76EE\u6A19\u4F53\u91CD", _jsxs("div", { className: "metric-input", children: [_jsx(Target, { size: 20 }), _jsx("input", { type: "number", inputMode: "decimal", min: "30", max: "300", step: "0.1", value: targetWeight, onChange: e => setTargetWeight(e.target.value), placeholder: "\u4F8B 70.3", required: true }), _jsx("span", { children: "kg" })] })] }), _jsxs("label", { children: ["\u8A08\u91CF\u30BF\u30A4\u30DF\u30F3\u30B0", _jsxs("select", { value: weighInType, onChange: e => setWeighInType(e.target.value), children: [_jsx("option", { value: "same_day", children: "\u5F53\u65E5\u8A08\u91CF" }), _jsx("option", { value: "day_before", children: "\u524D\u65E5\u8A08\u91CF" })] })] }), _jsxs("label", { children: ["\u6C34\u629C\u304D\u4E88\u5B9A", _jsxs("div", { className: "metric-input", children: [_jsx(TrendingDown, { size: 20 }), _jsx("input", { type: "number", inputMode: "decimal", min: "0", max: "15", step: "0.1", value: waterCutKg, onChange: e => setWaterCutKg(e.target.value), placeholder: "\u4F8B 2.5", required: true }), _jsx("span", { children: "kg" })] })] })] }), error && _jsx("p", { className: "form-error", role: "alert", children: error }), _jsxs("button", { className: "primary-button", children: ["\u6B21\u3078", _jsx(ChevronRight, { size: 18 })] })] }) : _jsxs("form", { onSubmit: submit, children: [_jsxs("div", { className: "setup-form-heading", children: [_jsx("strong", { children: "\u30AB\u30ED\u30EA\u30FC\u8A08\u7B97\u8A2D\u5B9A" }), _jsx("small", { children: "BMR\u30FBTDEE\u306E\u8A08\u7B97\u306B\u5FC5\u8981\u3067\u3059" })] }), _jsxs("div", { className: "setup-grid", children: [_jsxs("label", { children: ["\u5E74\u9F62", _jsxs("div", { className: "metric-input", children: [_jsx(UserRound, { size: 20 }), _jsx("input", { type: "number", inputMode: "numeric", min: "16", max: "90", value: age, onChange: e => setAge(e.target.value), placeholder: "\u4F8B 24", autoFocus: true, required: true }), _jsx("span", { children: "\u6B73" })] })] }), _jsxs("label", { children: ["\u6D3B\u52D5\u91CF", _jsx("select", { value: activityLevel, onChange: e => setActivityLevel(e.target.value), children: activityOptions.map(o => _jsxs("option", { value: o.value, children: [o.label, " \u2014 ", o.hint] }, o.value)) })] })] }), _jsxs("div", { className: "setup-review", children: [_jsxs("span", { children: ["\u8EAB\u9577 ", _jsxs("strong", { children: [heightCm, "cm"] })] }), _jsxs("span", { children: ["\u73FE\u4F53\u91CD ", _jsxs("strong", { children: [currentWeight, "kg"] })] }), _jsxs("span", { children: ["\u76EE\u6A19 ", _jsxs("strong", { children: [targetWeight, "kg"] })] }), _jsxs("span", { children: ["\u6C34\u629C\u304D ", _jsxs("strong", { children: [Number(waterCutKg || 0).toFixed(1), "kg"] })] }), _jsxs("span", { children: ["\u8A08\u91CF ", _jsx("strong", { children: weighInType === 'day_before' ? '前日' : '当日' })] }), _jsxs("span", { children: ["\u6027\u5225 ", _jsx("strong", { children: sex === 'male' ? '男性' : '女性' })] })] }), error && _jsx("p", { className: "form-error", role: "alert", children: error }), _jsxs("div", { className: "setup-actions", children: [_jsxs("button", { type: "button", className: "secondary-button", onClick: () => { setError(''); setStep(1); }, children: [_jsx(ArrowLeft, { size: 17 }), "\u623B\u308B"] }), _jsxs("button", { className: "primary-button", disabled: saving, children: [saving ? '保存中…' : '設定を保存して開始', _jsx(ChevronRight, { size: 18 })] })] })] })] })] });
}
function PanelHeading({ number, title, subtitle }) {
    return _jsxs("div", { className: "panel-heading", children: [_jsx("span", { children: number }), _jsxs("div", { children: [_jsx("h2", { children: title }), _jsx("p", { children: subtitle })] })] });
}
function AccountPanel({ user, onUserChanged }) {
    const [email, setEmail] = useState(user.email ?? '');
    const [currentPassword, setCurrentPassword] = useState('');
    const [notice, setNotice] = useState('');
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);
    const [sendingReset, setSendingReset] = useState(false);
    const isChangingExistingEmail = Boolean(user.email && email.trim().toLowerCase() !== user.email);
    useEffect(() => setEmail(user.email ?? ''), [user.email]);
    async function saveEmail(event) {
        event.preventDefault();
        setError('');
        setNotice('');
        setSaving(true);
        try {
            const result = await api('/account/email', {
                method: 'PUT',
                body: JSON.stringify({ email, currentPassword }),
            });
            onUserChanged(result.user);
            setCurrentPassword('');
            setNotice(user.email ? 'メールアドレスを更新しました。' : 'メールアドレスを登録しました。');
        }
        catch (caught) {
            setError(caught instanceof Error ? caught.message : 'メールアドレスを保存できませんでした。');
        }
        finally {
            setSaving(false);
        }
    }
    async function sendResetEmail() {
        if (!user.email)
            return;
        setError('');
        setNotice('');
        setSendingReset(true);
        try {
            const result = await api('/forgot-password', {
                method: 'POST',
                body: JSON.stringify({ email: user.email }),
            });
            setNotice(result.message);
        }
        catch (caught) {
            setError(caught instanceof Error ? caught.message : '再設定メールを送信できませんでした。');
        }
        finally {
            setSendingReset(false);
        }
    }
    return _jsxs("section", { className: "settings-summary-section account-settings-section", id: "account-email", children: [_jsx("div", { className: "settings-section-head", children: _jsx("h2", { children: "\u30A2\u30AB\u30A6\u30F3\u30C8" }) }), _jsxs("form", { className: "account-settings-card", onSubmit: saveEmail, children: [_jsxs("label", { children: ["\u30E1\u30FC\u30EB\u30A2\u30C9\u30EC\u30B9", _jsxs("div", { className: "account-input", children: [_jsx(Mail, { size: 17 }), _jsx("input", { type: "email", value: email, onChange: (event) => setEmail(event.target.value), autoComplete: "email", placeholder: "name@example.com", required: true, maxLength: 254 })] })] }), isChangingExistingEmail && _jsxs("label", { children: ["\u73FE\u5728\u306E\u30D1\u30B9\u30EF\u30FC\u30C9", _jsxs("div", { className: "account-input", children: [_jsx(ShieldCheck, { size: 17 }), _jsx("input", { type: "password", value: currentPassword, onChange: (event) => setCurrentPassword(event.target.value), autoComplete: "current-password", placeholder: "\u5909\u66F4\u78BA\u8A8D\u306E\u305F\u3081\u5165\u529B", required: true, minLength: 8, maxLength: 128 })] })] }), _jsxs("div", { className: "account-actions", children: [_jsx("button", { className: "account-save-button", disabled: saving, children: saving ? '保存中…' : user.email ? 'メールを変更' : 'メールを登録' }), user.email && _jsxs("button", { type: "button", className: "account-reset-button", onClick: sendResetEmail, disabled: sendingReset, children: [_jsx(Mail, { size: 15 }), sendingReset ? '送信中…' : '再設定メールを送る'] })] }), !user.email && _jsx("p", { className: "account-help", children: "\u65E2\u5B58\u30A2\u30AB\u30A6\u30F3\u30C8\u306F\u3001\u3053\u3053\u3067\u30E1\u30FC\u30EB\u3092\u767B\u9332\u3059\u308B\u3068\u300C\u30D1\u30B9\u30EF\u30FC\u30C9\u3092\u5FD8\u308C\u305F\u65B9\u300D\u304C\u4F7F\u3048\u308B\u3088\u3046\u306B\u306A\u308A\u307E\u3059\u3002" }), error && _jsx("p", { className: "account-error", role: "alert", children: error }), notice && _jsx("p", { className: "account-notice", role: "status", children: notice })] })] });
}
function ProfilePanel({ profile, onSaved }) {
    const [heightCm, setHeightCm] = useState(profile ? String(profile.heightCm) : '');
    const [age, setAge] = useState(profile ? String(profile.age) : '');
    const [sex, setSex] = useState(profile?.sex ?? 'male');
    const [activityLevel, setActivityLevel] = useState(profile?.activityLevel ?? 'moderate');
    const [notice, setNotice] = useState('');
    const [saving, setSaving] = useState(false);
    useEffect(() => {
        if (!profile)
            return;
        setHeightCm(String(profile.heightCm));
        setAge(String(profile.age));
        setSex(profile.sex);
        setActivityLevel(profile.activityLevel);
    }, [profile]);
    async function submit(event) {
        event.preventDefault();
        setSaving(true);
        setNotice('');
        try {
            const result = await api('/profile', {
                method: 'PUT',
                body: JSON.stringify({ heightCm: Number(heightCm), age: Number(age), sex, activityLevel }),
            });
            onSaved(result.profile);
            setNotice('プロフィールを保存しました。');
        }
        catch (caught) {
            setNotice(caught instanceof Error ? caught.message : '保存できませんでした。');
        }
        finally {
            setSaving(false);
        }
    }
    return (_jsxs("div", { className: "panel profile-panel", children: [_jsx(PanelHeading, { number: "02", title: "\u8EAB\u4F53\u30D7\u30ED\u30D5\u30A3\u30FC\u30EB", subtitle: "\u57FA\u790E\u4EE3\u8B1D\u3068\u6D88\u8CBB\u30AB\u30ED\u30EA\u30FC\u306E\u8A08\u7B97\u306B\u4F7F\u7528" }), _jsxs("form", { className: "profile-form", onSubmit: submit, children: [_jsxs("label", { children: ["\u8EAB\u9577", _jsxs("div", { className: "metric-input", children: [_jsx(Ruler, { size: 18 }), _jsx("input", { type: "number", inputMode: "decimal", min: "120", max: "230", step: "0.1", value: heightCm, onChange: (event) => setHeightCm(event.target.value), placeholder: "\u4F8B 170", required: true }), _jsx("span", { children: "cm" })] })] }), _jsxs("label", { children: ["\u5E74\u9F62", _jsxs("div", { className: "metric-input", children: [_jsx(UserRound, { size: 18 }), _jsx("input", { type: "number", inputMode: "numeric", min: "16", max: "90", step: "1", value: age, onChange: (event) => setAge(event.target.value), placeholder: "\u4F8B 24", required: true }), _jsx("span", { children: "\u6B73" })] })] }), _jsxs("label", { children: ["\u6027\u5225\uFF08BMR\u8A08\u7B97\u7528\uFF09", _jsxs("select", { value: sex, onChange: (event) => setSex(event.target.value), children: [_jsx("option", { value: "male", children: "\u7537\u6027" }), _jsx("option", { value: "female", children: "\u5973\u6027" })] })] }), _jsxs("label", { className: "activity-field", children: ["\u666E\u6BB5\u306E\u6D3B\u52D5\u91CF", _jsx("select", { value: activityLevel, onChange: (event) => setActivityLevel(event.target.value), children: activityOptions.map((option) => _jsxs("option", { value: option.value, children: [option.label, " \u2014 ", option.hint] }, option.value)) })] }), _jsxs("button", { className: "save-button profile-save", disabled: saving, children: [_jsx(Save, { size: 17 }), saving ? '保存中…' : profile ? 'プロフィールを更新' : 'プロフィールを保存'] })] }), notice && _jsx("p", { className: "save-notice", role: "status", children: notice })] }));
}
function CaloriesPanel({ nutrition, profile, prediction }) {
    return (_jsxs("div", { className: "panel calorie-panel", children: [_jsx(PanelHeading, { number: "03", title: "\u4ECA\u65E5\u306E\u30AB\u30ED\u30EA\u30FC", subtitle: "BMR\u30FB\u6D3B\u52D5\u91CF\u30FB\u6E1B\u91CF\u30DA\u30FC\u30B9\u304B\u3089\u81EA\u52D5\u8A08\u7B97" }), !profile || !nutrition ? (_jsxs("div", { className: "calorie-empty", children: [_jsx(Flame, { size: 30 }), _jsxs("div", { children: [_jsx("strong", { children: "\u30D7\u30ED\u30D5\u30A3\u30FC\u30EB\u3092\u5165\u529B\u3059\u308B\u3068\u8A08\u7B97\u3067\u304D\u307E\u3059" }), _jsx("p", { children: "\u8EAB\u9577\u30FB\u5E74\u9F62\u30FB\u6027\u5225\u30FB\u6D3B\u52D5\u91CF\u304B\u3089\u57FA\u790E\u4EE3\u8B1D\u30681\u65E5\u306E\u6D88\u8CBB\u76EE\u5B89\u3092\u8868\u793A\u3057\u307E\u3059\u3002" })] })] })) : (_jsxs(_Fragment, { children: [_jsxs("div", { className: "calorie-hero", children: [_jsxs("div", { children: [_jsx("small", { children: "\u4ECA\u65E5\u3042\u3068" }), _jsxs("strong", { className: nutrition.remaining < 0 ? 'over' : '', children: [Math.abs(Math.round(nutrition.remaining)).toLocaleString(), _jsx("span", { children: "kcal" })] }), _jsx("p", { children: nutrition.remaining >= 0 ? '摂取目安までの残り' : '摂取目安を超過' })] }), _jsxs("div", { className: "calorie-ring", "aria-label": `摂取 ${Math.round(nutrition.consumed)} kcal / 目標 ${Math.round(nutrition.targetCalories)} kcal`, children: [_jsx("span", { children: Math.round(nutrition.consumed).toLocaleString() }), _jsxs("small", { children: ["/ ", Math.round(nutrition.effectiveTargetCalories).toLocaleString(), " kcal"] })] })] }), _jsxs("div", { className: "calorie-stats", children: [_jsxs("div", { children: [_jsx(Flame, { size: 17 }), _jsx("small", { children: "\u57FA\u790E\u4EE3\u8B1D" }), _jsxs("b", { children: [Math.round(nutrition.bmr).toLocaleString(), " kcal"] })] }), _jsxs("div", { children: [_jsx(Activity, { size: 17 }), _jsx("small", { children: "\u63A8\u5B9A\u6D88\u8CBB" }), _jsxs("b", { children: [Math.round(nutrition.tdee).toLocaleString(), " kcal"] })] }), _jsxs("div", { children: [_jsx(TrendingDown, { size: 17 }), _jsx("small", { children: "\u5FC5\u8981\u8D64\u5B57" }), _jsxs("b", { children: [Math.round(nutrition.dailyDeficitNeeded).toLocaleString(), " kcal/\u65E5"] })] })] }), _jsxs("div", { className: "macro-row", children: [_jsxs("span", { children: ["P ", _jsxs("b", { children: [Math.round(nutrition.protein), "g"] })] }), _jsxs("span", { children: ["F ", _jsxs("b", { children: [Math.round(nutrition.fat), "g"] })] }), _jsxs("span", { children: ["C ", _jsxs("b", { children: [Math.round(nutrition.carbs), "g"] })] })] }), nutrition.calorieStatus !== 'safe' && _jsxs("div", { className: `nutrition-warning ${nutrition.calorieStatus}`, children: [_jsx(AlertTriangle, { size: 18 }), _jsx("p", { children: nutrition.targetCalories < nutrition.bmr ? '必要摂取量の計算値が基礎代謝を下回っています。日程や目標体重の見直しを検討してください。' : '必要なエネルギー赤字が大きめです。体調と練習パフォーマンスを優先してください。' })] }), _jsxs("div", { className: "prediction-box", children: [_jsx("span", { children: "\u4F53\u91CD\u4E88\u6E2C" }), prediction?.available ? _jsxs(_Fragment, { children: [_jsxs("strong", { children: ["\u8A08\u91CF\u524D\u4E88\u6E2C ", prediction.predictedWeight.toFixed(1), " kg"] }), _jsxs("p", { children: ["\u76F4\u8FD1", prediction.samples, "\u56DE\u306E\u8A18\u9332\uFF1A\u9031 ", prediction.weeklyTrend > 0 ? '+' : '', prediction.weeklyTrend.toFixed(2), " kg\u3002\u76EE\u6A19\u3068\u306E\u5DEE ", prediction.differenceFromTarget > 0 ? '+' : '', prediction.differenceFromTarget.toFixed(1), " kg\u3002"] })] }) : _jsxs(_Fragment, { children: [_jsx("strong", { children: "\u8A18\u9332\u3092\u8FFD\u52A0\u3057\u3066\u304F\u3060\u3055\u3044" }), _jsx("p", { children: prediction?.reason ?? '体重記録が増えると予測を表示します。' })] })] })] })), _jsx("p", { className: "estimate-note", children: "\u203B BMR\u306FMifflin-St Jeor\u5F0F\u3001\u6D88\u8CBB\u30AB\u30ED\u30EA\u30FC\u306F\u6D3B\u52D5\u4FC2\u6570\u3092\u4F7F\u3063\u305F\u63A8\u5B9A\u3067\u3059\u3002\u5B9F\u969B\u306E\u6D88\u8CBB\u91CF\u306B\u306F\u500B\u4EBA\u5DEE\u304C\u3042\u308A\u307E\u3059\u3002" })] }));
}
function calculateMetrics(plan) {
    const today = dateAtNoon(isoToday());
    const fightDays = daysBetween(today, dateAtNoon(plan.fightDate));
    const cutDays = daysBetween(today, dateAtNoon(weighInDateIso(plan)));
    const weeks = Math.max(cutDays / 7, 0.15);
    const dietTarget = dietTargetWeight(plan);
    const toCut = Math.max(0, plan.currentWeight - dietTarget);
    const weekly = toCut / weeks;
    const cutPercent = plan.currentWeight ? (toCut / plan.currentWeight) * 100 : 0;
    const weeklyPercent = plan.currentWeight ? (weekly / plan.currentWeight) * 100 : 0;
    const status = weeklyPercent <= 0.75 ? 'safe' : weeklyPercent <= 1 ? 'caution' : 'danger';
    const statusLabel = status === 'safe' ? '無理の少ないペース' : status === 'caution' ? '注意が必要なペース' : '危険性が高いペース';
    const waterNote = normalizedWaterCut(plan) > 0 ? ` 計量前に水抜き ${normalizedWaterCut(plan).toFixed(1)} kgを予定。` : '';
    const statusMessage = status === 'safe' ? '現在の設定は比較的ゆとりがあります。' : status === 'caution' ? '体調を確認しながら慎重に進めてください。' : '目標・日程の見直しを強く推奨します。';
    const statusDetail = status === 'safe' ? `通常減量は週平均 ${weekly.toFixed(2)} kg。毎日の変化ではなく、7日平均で進捗を確認しましょう。${waterNote}` : status === 'caution' ? `通常減量で週に体重の ${weeklyPercent.toFixed(2)}% を落とす計算です。疲労・睡眠・練習強度に注意してください。${waterNote}` : `通常減量で週に体重の ${weeklyPercent.toFixed(2)}% を落とす計算です。急な水抜きを行わず、専門家へ相談してください。${waterNote}`;
    const totalWeeks = Math.max(1, Math.ceil(weeks));
    const targets = Array.from({ length: Math.min(totalWeeks, 12) }, (_, index) => {
        const elapsed = Math.min((index + 1) * 7, cutDays);
        const ratio = cutDays ? elapsed / cutDays : 1;
        const date = new Date(today);
        date.setDate(date.getDate() + elapsed);
        return { date: date.toISOString().slice(0, 10), weight: plan.currentWeight - toCut * ratio };
    });
    return { days: fightDays, cutDays, toCut, weekly, weeklyPercent, cutPercent, status, statusLabel, statusMessage, statusDetail, targets, dietTarget };
}
function WeightChart({ plan, records }) {
    const [rangeMode, setRangeMode] = useState('30');
    const [selectedId, setSelectedId] = useState(null);
    const width = 760, height = 220, left = 50, right = 22, top = 18, bottom = 34;
    const sorted = [...records].sort((a, b) => a.recordedOn.localeCompare(b.recordedOn));
    const todayMs = dateAtNoon(isoToday()).getTime();
    const fightMs = dateAtNoon(weighInDateIso(plan)).getTime();
    const firstRecord = sorted[0];
    const planStartMs = firstRecord ? dateAtNoon(firstRecord.recordedOn).getTime() : todayMs;
    const planStartWeight = firstRecord?.weight ?? plan.currentWeight;
    const startMs = rangeMode === '7'
        ? todayMs - 6 * 86400000
        : rangeMode === '30'
            ? todayMs - 29 * 86400000
            : rangeMode === '90'
                ? todayMs - 89 * 86400000
                : Math.min(planStartMs, todayMs);
    const endMs = rangeMode === 'all' ? Math.max(fightMs, todayMs + 86400000) : todayMs;
    const visible = sorted.filter((record) => {
        const time = dateAtNoon(record.recordedOn).getTime();
        return time >= startMs && time <= endMs;
    });
    const idealWeightAt = (time) => {
        if (fightMs <= planStartMs)
            return dietTargetWeight(plan);
        const ratio = Math.min(1, Math.max(0, (time - planStartMs) / (fightMs - planStartMs)));
        return planStartWeight + (dietTargetWeight(plan) - planStartWeight) * ratio;
    };
    const idealStartWeight = idealWeightAt(startMs);
    const idealEndWeight = idealWeightAt(endMs);
    const scaleWeights = [plan.currentWeight, idealStartWeight, idealEndWeight, ...visible.map((record) => record.weight)];
    if (rangeMode === 'all')
        scaleWeights.push(dietTargetWeight(plan));
    const rawMin = Math.min(...scaleWeights);
    const rawMax = Math.max(...scaleWeights);
    const padding = Math.max(0.6, (rawMax - rawMin) * 0.12);
    const minWeight = Math.floor((rawMin - padding) * 2) / 2;
    const maxWeight = Math.ceil((rawMax + padding) * 2) / 2;
    const weightRange = Math.max(1, maxWeight - minWeight);
    const x = (date) => left + ((Math.max(startMs, Math.min(endMs, date)) - startMs) / Math.max(1, endMs - startMs)) * (width - left - right);
    const y = (weight) => top + ((maxWeight - weight) / weightRange) * (height - top - bottom);
    const actualPath = visible.map((record, index) => `${index ? 'L' : 'M'} ${x(dateAtNoon(record.recordedOn).getTime())} ${y(record.weight)}`).join(' ');
    const actualAreaPath = visible.length > 1 ? `${actualPath} L ${x(dateAtNoon(visible[visible.length - 1].recordedOn).getTime())} ${height - bottom} L ${x(dateAtNoon(visible[0].recordedOn).getTime())} ${height - bottom} Z` : '';
    const ticks = Array.from({ length: 4 }, (_, index) => maxWeight - (weightRange * index) / 3);
    const latestVisible = visible[visible.length - 1];
    const selected = visible.find((record) => record.id === selectedId) ?? null;
    const shortRange = rangeMode !== 'all';
    return (_jsxs("div", { className: "chart-block", children: [_jsxs("div", { className: "chart-range", role: "group", "aria-label": "\u30B0\u30E9\u30D5\u671F\u9593", children: [_jsx("button", { className: rangeMode === '7' ? 'active' : '', onClick: () => { setRangeMode('7'); setSelectedId(null); }, children: "1\u9031" }), _jsx("button", { className: rangeMode === '30' ? 'active' : '', onClick: () => { setRangeMode('30'); setSelectedId(null); }, children: "1\u30F6\u6708" }), _jsx("button", { className: rangeMode === '90' ? 'active' : '', onClick: () => { setRangeMode('90'); setSelectedId(null); }, children: "3\u30F6\u6708" }), _jsx("button", { className: rangeMode === 'all' ? 'active' : '', onClick: () => { setRangeMode('all'); setSelectedId(null); }, children: "\u5168\u671F\u9593" })] }), _jsxs("div", { className: "chart-wrap redesigned-chart", children: [_jsxs("svg", { viewBox: `0 0 ${width} ${height}`, role: "img", "aria-label": "\u76EE\u6A19\u30E9\u30A4\u30F3\u3068\u5B9F\u6E2C\u4F53\u91CD\u306E\u30B0\u30E9\u30D5", children: [ticks.map((tick, index) => _jsxs("g", { children: [_jsx("line", { className: "grid-line", x1: left, y1: top + index * ((height - top - bottom) / 3), x2: width - right, y2: top + index * ((height - top - bottom) / 3) }), _jsx("text", { className: "weight-label", textAnchor: "end", x: left - 9, y: top + index * ((height - top - bottom) / 3) + 4, children: tick.toFixed(1) })] }, `${tick}-${index}`)), rangeMode === 'all' && _jsxs(_Fragment, { children: [_jsx("line", { className: "goal-horizontal", x1: left, y1: y(plan.targetWeight), x2: width - right, y2: y(plan.targetWeight) }), _jsxs("text", { className: "goal-label", textAnchor: "end", x: width - right, y: Math.max(14, y(plan.targetWeight) - 7), children: ["\u76EE\u6A19 ", plan.targetWeight.toFixed(1), " kg"] })] }), _jsx("line", { className: "cut-line", x1: x(startMs), y1: y(idealStartWeight), x2: x(endMs), y2: y(idealEndWeight) }), rangeMode === 'all' && fightMs >= startMs && fightMs <= endMs && _jsx("circle", { className: "cut-end", cx: x(fightMs), cy: y(plan.targetWeight), r: "5" }), actualAreaPath && _jsx("path", { className: "actual-area", d: actualAreaPath }), actualPath && _jsx("path", { className: "actual-line", d: actualPath }), visible.map((record) => {
                                const isLatest = latestVisible?.id === record.id;
                                return _jsx("circle", { className: `actual-point ${isLatest ? 'latest' : ''} ${selectedId === record.id ? 'selected' : ''}`, cx: x(dateAtNoon(record.recordedOn).getTime()), cy: y(record.weight), r: isLatest ? 6 : 4.5, tabIndex: 0, role: "button", "aria-label": `${formatShortDate(record.recordedOn)} ${record.weight.toFixed(1)}kg`, onClick: () => setSelectedId(record.id), onKeyDown: (event) => { if (event.key === 'Enter' || event.key === ' ')
                                        setSelectedId(record.id); } }, record.id);
                            }), selected && _jsxs("g", { className: "chart-tooltip", transform: `translate(${Math.max(90, Math.min(width - 100, x(dateAtNoon(selected.recordedOn).getTime())))},${Math.max(34, y(selected.weight) - 38)})`, children: [_jsx("rect", { x: "-82", y: "-24", width: "164", height: "32", rx: "9" }), _jsxs("text", { textAnchor: "middle", y: "-3", children: [formatShortDate(selected.recordedOn), "\u3000", selected.weight.toFixed(1), "kg"] })] }), _jsx("text", { className: "axis-date", x: left, y: height - 10, children: formatChartDate(new Date(startMs)) }), !shortRange && _jsx("text", { className: "axis-date today-axis", textAnchor: "middle", x: x(todayMs), y: height - 10, children: "\u4ECA\u65E5" }), _jsx("text", { className: "axis-date fight-axis", textAnchor: "end", x: width - right, y: height - 10, children: shortRange ? '今日' : `計量 ${formatChartDate(new Date(fightMs))}` })] }), visible.length === 0 && _jsx("p", { className: "chart-empty", children: "\u3053\u306E\u671F\u9593\u306E\u4F53\u91CD\u8A18\u9332\u306F\u307E\u3060\u3042\u308A\u307E\u305B\u3093\u3002" })] }), _jsxs("div", { className: "graph-legend", children: [_jsxs("span", { children: [_jsx("i", { className: "actual-swatch" }), "\u5B9F\u6E2C\u4F53\u91CD"] }), _jsxs("span", { children: [_jsx("i", { className: "ideal-swatch" }), "\u76EE\u6A19\u6E1B\u91CF\u30E9\u30A4\u30F3"] }), rangeMode === 'all' && _jsxs("span", { children: [_jsx("i", { className: "goal-swatch" }), "\u6C34\u629C\u304D\u524D\u76EE\u6A19"] })] })] }));
}
function ConditionPanel({ conditions, onSaved, onRemoved }) {
    const todayExisting = conditions.find((entry) => entry.recordedOn === isoToday());
    const [recordedOn, setRecordedOn] = useState(isoToday());
    const [sleepHours, setSleepHours] = useState(String(todayExisting?.sleepHours ?? 7.5));
    const [fatigue, setFatigue] = useState(todayExisting?.fatigue ?? 3);
    const [hunger, setHunger] = useState(todayExisting?.hunger ?? 3);
    const [trainingIntensity, setTrainingIntensity] = useState(todayExisting?.trainingIntensity ?? 3);
    const [bodyCondition, setBodyCondition] = useState(todayExisting?.bodyCondition ?? 3);
    const [restingHeartRate, setRestingHeartRate] = useState(todayExisting?.restingHeartRate ? String(todayExisting.restingHeartRate) : '');
    const [note, setNote] = useState(todayExisting?.note ?? '');
    const [message, setMessage] = useState('');
    const [saving, setSaving] = useState(false);
    useEffect(() => {
        const existing = conditions.find((entry) => entry.recordedOn === recordedOn);
        setSleepHours(String(existing?.sleepHours ?? 7.5));
        setFatigue(existing?.fatigue ?? 3);
        setHunger(existing?.hunger ?? 3);
        setTrainingIntensity(existing?.trainingIntensity ?? 3);
        setBodyCondition(existing?.bodyCondition ?? 3);
        setRestingHeartRate(existing?.restingHeartRate ? String(existing.restingHeartRate) : '');
        setNote(existing?.note ?? '');
    }, [recordedOn, conditions]);
    const previewScore = calculateConditionScore({ sleepHours: Number(sleepHours || 0), fatigue, hunger, bodyCondition });
    async function save(event) {
        event.preventDefault();
        setSaving(true);
        setMessage('');
        try {
            const result = await api('/conditions', {
                method: 'POST',
                body: JSON.stringify({ recordedOn, sleepHours: Number(sleepHours), fatigue, hunger, trainingIntensity, bodyCondition, restingHeartRate, note }),
            });
            onSaved(result.condition);
            setMessage('コンディションを保存しました。');
        }
        catch (caught) {
            setMessage(caught instanceof Error ? caught.message : '保存できませんでした。');
        }
        finally {
            setSaving(false);
        }
    }
    async function remove(id) {
        if (!window.confirm('このコンディション記録を削除しますか？'))
            return;
        try {
            await api(`/conditions/${id}`, { method: 'DELETE' });
            onRemoved(id);
            setMessage('コンディション記録を削除しました。');
        }
        catch (caught) {
            setMessage(caught instanceof Error ? caught.message : '削除できませんでした。');
        }
    }
    const recent = conditions.slice(0, 7);
    return _jsxs("div", { className: "panel condition-panel", children: [_jsxs("div", { className: "condition-head", children: [_jsxs("div", { children: [_jsx("small", { children: "DAILY CONDITION" }), _jsx("h2", { children: "\u30B3\u30F3\u30C7\u30A3\u30B7\u30E7\u30F3" }), _jsx("p", { children: "\u7761\u7720\u30FB\u75B2\u52B4\u30FB\u7A7A\u8179\u30FB\u4F53\u611F\u304B\u30890\u301C100\u3067\u8868\u793A\u3057\u307E\u3059\u3002" })] }), _jsxs("div", { className: "condition-score", children: [_jsx("span", { children: "\u4ECA\u65E5" }), _jsx("strong", { children: previewScore ?? '—' }), _jsx("small", { children: "/100" })] })] }), _jsxs("form", { className: "condition-form", onSubmit: save, children: [_jsxs("label", { children: ["\u65E5\u4ED8", _jsxs("div", { className: "metric-input", children: [_jsx(CalendarDays, { size: 18 }), _jsx("input", { type: "date", max: isoToday(), value: recordedOn, onChange: (event) => setRecordedOn(event.target.value), required: true })] })] }), _jsxs("label", { children: ["\u7761\u7720\u6642\u9593", _jsxs("div", { className: "metric-input", children: [_jsx(HeartPulse, { size: 18 }), _jsx("input", { type: "number", min: "0", max: "16", step: "0.5", inputMode: "decimal", value: sleepHours, onChange: (event) => setSleepHours(event.target.value), required: true }), _jsx("span", { children: "h" })] })] }), _jsx(RatingField, { label: "\u75B2\u52B4\u5EA6", value: fatigue, onChange: setFatigue, low: "\u5C11", high: "\u5F37" }), _jsx(RatingField, { label: "\u7A7A\u8179\u5EA6", value: hunger, onChange: setHunger, low: "\u5C11", high: "\u5F37" }), _jsx(RatingField, { label: "\u7DF4\u7FD2\u5F37\u5EA6", value: trainingIntensity, onChange: setTrainingIntensity, low: "\u8EFD", high: "\u9AD8" }), _jsx(RatingField, { label: "\u4F53\u8ABF", value: bodyCondition, onChange: setBodyCondition, low: "\u60AA", high: "\u826F", positive: true }), _jsxs("label", { children: ["\u5B89\u9759\u6642\u5FC3\u62CD\uFF08\u4EFB\u610F\uFF09", _jsxs("div", { className: "metric-input", children: [_jsx(HeartPulse, { size: 18 }), _jsx("input", { type: "number", min: "30", max: "220", inputMode: "numeric", value: restingHeartRate, onChange: (event) => setRestingHeartRate(event.target.value), placeholder: "\u4F8B 58" }), _jsx("span", { children: "bpm" })] })] }), _jsxs("label", { className: "condition-note", children: ["\u30E1\u30E2\uFF08\u4EFB\u610F\uFF09", _jsx("input", { value: note, onChange: (event) => setNote(event.target.value), maxLength: 160, placeholder: "\u4F8B\uFF1A\u30B9\u30D1\u30FC\u5F8C\u3067\u811A\u304C\u91CD\u3044" })] }), _jsxs("button", { className: "add-button condition-save", disabled: saving, children: [_jsx(Save, { size: 18 }), saving ? '保存中…' : conditions.some((entry) => entry.recordedOn === recordedOn) ? 'この日を更新' : '記録する'] })] }), message && _jsx("p", { className: "record-message", role: "status", children: message }), _jsx("p", { className: "condition-formula-note", children: "\u30B9\u30B3\u30A2\u306F\u7761\u772030%\u30FB\u75B2\u52B425%\u30FB\u7A7A\u817915%\u30FB\u81EA\u5DF1\u8A55\u4FA130%\u3067\u7B97\u51FA\u3002\u7DF4\u7FD2\u5F37\u5EA6\u3068\u5FC3\u62CD\u306F\u5224\u65AD\u6750\u6599\u3068\u3057\u3066\u8A18\u9332\u3057\u307E\u3059\u3002" }), recent.length > 0 && _jsx("div", { className: "condition-history", children: recent.map((entry) => _jsxs("div", { children: [_jsx("time", { children: formatShortDate(entry.recordedOn) }), _jsxs("strong", { children: [calculateConditionScore(entry), "/100"] }), _jsxs("span", { children: ["\u7761\u7720 ", entry.sleepHours.toFixed(1), "h"] }), _jsxs("span", { children: ["\u75B2\u52B4 ", entry.fatigue, "/5"] }), _jsx("button", { onClick: () => remove(entry.id), "aria-label": "\u524A\u9664", children: _jsx(Trash2, { size: 15 }) })] }, entry.id)) })] });
}
function RatingField({ label, value, onChange, low, high, positive = false }) {
    return _jsxs("fieldset", { className: "rating-field", children: [_jsx("legend", { children: label }), _jsx("div", { children: [1, 2, 3, 4, 5].map((number) => _jsx("button", { type: "button", className: value === number ? 'active' : '', onClick: () => onChange(number), children: number }, number)) }), _jsx("small", { children: positive ? `${low} ← → ${high}` : `${low} ← → ${high}` })] });
}
const mealTypeLabels = { breakfast: '朝食', lunch: '昼食', dinner: '夕食', snack: '間食' };
function MealPanel({ meals, templates, onMealSaved, onMealRemoved, onTemplateSaved, onTemplateRemoved }) {
    const [eatenOn, setEatenOn] = useState(isoToday());
    const [mealType, setMealType] = useState('breakfast');
    const [name, setName] = useState('');
    const [calories, setCalories] = useState('');
    const [protein, setProtein] = useState('');
    const [fat, setFat] = useState('');
    const [carbs, setCarbs] = useState('');
    const [editingId, setEditingId] = useState(null);
    const [openMealType, setOpenMealType] = useState(null);
    const [formOpen, setFormOpen] = useState(false);
    const [message, setMessage] = useState('');
    const [saving, setSaving] = useState(false);
    function reset(closeForm = false) {
        setEditingId(null);
        setName('');
        setCalories('');
        setProtein('');
        setFat('');
        setCarbs('');
        if (closeForm)
            setFormOpen(false);
    }
    function focusForm(type) {
        if (type) {
            setMealType(type);
            setOpenMealType(type);
        }
        setFormOpen(true);
        window.setTimeout(() => document.getElementById('meal-form-fields')?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 30);
    }
    function editMeal(meal) {
        setEditingId(meal.id);
        setEatenOn(meal.eatenOn);
        setMealType(meal.mealType || 'snack');
        setOpenMealType(meal.mealType || 'snack');
        setName(meal.name);
        setCalories(String(meal.calories));
        setProtein(String(meal.protein));
        setFat(String(meal.fat));
        setCarbs(String(meal.carbs));
        focusForm(meal.mealType || 'snack');
    }
    async function saveMeal(event) {
        event.preventDefault();
        setMessage('');
        setSaving(true);
        const body = JSON.stringify({ eatenOn, mealType, name, calories: Number(calories), protein: Number(protein || 0), fat: Number(fat || 0), carbs: Number(carbs || 0) });
        try {
            const result = await api(editingId ? `/meals/${editingId}` : '/meals', { method: editingId ? 'PUT' : 'POST', body });
            onMealSaved(result.meal);
            setOpenMealType(result.meal.mealType || mealType);
            setMessage(editingId ? '食事記録を更新しました。' : '食事を記録しました。残りカロリーを更新しました。');
            reset(true);
        }
        catch (caught) {
            setMessage(caught instanceof Error ? caught.message : '記録できませんでした。');
        }
        finally {
            setSaving(false);
        }
    }
    async function removeMeal(id) {
        if (!window.confirm('この食事記録を削除しますか？'))
            return;
        try {
            await api(`/meals/${id}`, { method: 'DELETE' });
            onMealRemoved(id);
            setMessage('食事記録を削除しました。');
            if (editingId === id)
                reset(true);
        }
        catch (caught) {
            setMessage(caught instanceof Error ? caught.message : '削除できませんでした。');
        }
    }
    async function useTemplate(template) {
        setMessage('');
        try {
            const result = await api('/meals', { method: 'POST', body: JSON.stringify({ eatenOn, mealType: template.mealType, name: template.name, calories: template.calories, protein: template.protein, fat: template.fat, carbs: template.carbs }) });
            onMealSaved(result.meal);
            setOpenMealType(template.mealType);
            setMessage(`${template.name}を記録しました。`);
        }
        catch (caught) {
            setMessage(caught instanceof Error ? caught.message : 'テンプレートを登録できませんでした。');
        }
    }
    async function saveTemplate() {
        if (!name.trim() || calories === '')
            return setMessage('食事名とkcalを入力してからテンプレート保存してください。');
        try {
            const result = await api('/templates', { method: 'POST', body: JSON.stringify({ mealType, name, calories: Number(calories), protein: Number(protein || 0), fat: Number(fat || 0), carbs: Number(carbs || 0) }) });
            onTemplateSaved(result.template);
            setMessage('食事テンプレートを保存しました。');
        }
        catch (caught) {
            setMessage(caught instanceof Error ? caught.message : 'テンプレートを保存できませんでした。');
        }
    }
    async function removeTemplate(id) {
        if (!window.confirm('この食事テンプレートを削除しますか？'))
            return;
        try {
            await api(`/templates/${id}`, { method: 'DELETE' });
            onTemplateRemoved(id);
            setMessage('テンプレートを削除しました。');
        }
        catch (caught) {
            setMessage(caught instanceof Error ? caught.message : 'テンプレートを削除できませんでした。');
        }
    }
    const visibleMeals = meals.filter((meal) => meal.eatenOn === eatenOn);
    const dayTotal = visibleMeals.reduce((sum, meal) => sum + meal.calories, 0);
    const types = ['breakfast', 'lunch', 'dinner', 'snack'];
    return _jsxs("div", { className: "panel meal-panel redesigned-meal-panel", id: "meal-record", children: [_jsxs("div", { className: "meal-panel-head", children: [_jsxs("div", { children: [_jsx("small", { children: "DAILY MEALS" }), _jsx("h2", { children: "\u98DF\u4E8B\u8A18\u9332" })] }), _jsxs("label", { children: ["\u65E5\u4ED8", _jsx("input", { type: "date", max: isoToday(), value: eatenOn, onChange: e => { setEatenOn(e.target.value); setOpenMealType(null); reset(true); } })] })] }), _jsxs("div", { className: "meal-day-total", children: [_jsxs("span", { children: [formatShortDate(eatenOn), " \u5408\u8A08"] }), _jsxs("strong", { children: [Math.round(dayTotal).toLocaleString(), " kcal"] })] }), templates.length > 0 && _jsxs("section", { className: "meal-template-strip", children: [_jsxs("div", { children: [_jsx("small", { children: "MY TEMPLATES" }), _jsx("strong", { children: "1\u30BF\u30C3\u30D7\u98DF\u4E8B\u767B\u9332" })] }), _jsx("div", { className: "meal-template-scroll", children: templates.map((template) => _jsxs("article", { children: [_jsxs("button", { className: "template-use", onClick: () => useTemplate(template), children: [_jsx("span", { children: mealTypeLabels[template.mealType] }), _jsx("strong", { children: template.name }), _jsxs("small", { children: [Math.round(template.calories), " kcal"] })] }), _jsx("button", { className: "template-delete", onClick: () => removeTemplate(template.id), "aria-label": `${template.name}テンプレートを削除`, children: _jsx(X, { size: 13 }) })] }, template.id)) })] }), _jsx("div", { className: "meal-type-grid", children: types.map((type) => {
                    const items = visibleMeals.filter((meal) => (meal.mealType || 'snack') === type);
                    const total = items.reduce((sum, meal) => sum + meal.calories, 0);
                    const isOpen = openMealType === type;
                    return _jsxs("section", { className: `meal-type-card ${isOpen ? 'open' : ''}`, children: [_jsxs("div", { className: "meal-type-card-head", children: [_jsxs("button", { type: "button", className: "meal-type-toggle", onClick: () => setOpenMealType(isOpen ? null : type), "aria-expanded": isOpen, children: [_jsxs("span", { children: [_jsx("small", { children: mealTypeLabels[type] }), _jsxs("strong", { children: [Math.round(total).toLocaleString(), " kcal"] })] }), _jsxs("span", { className: "meal-type-count", children: [items.length, "\u4EF6"] }), isOpen ? _jsx(ChevronUp, { size: 18 }) : _jsx(ChevronDown, { size: 18 })] }), _jsx("button", { type: "button", className: "meal-add-quick", onClick: () => focusForm(type), "aria-label": `${mealTypeLabels[type]}を追加`, children: _jsx(Plus, { size: 18 }) })] }), isOpen && _jsx("div", { className: "meal-type-body", children: items.length === 0 ? _jsx("p", { children: "\u307E\u3060\u8A18\u9332\u304C\u3042\u308A\u307E\u305B\u3093" }) : _jsx("div", { className: "meal-card-items", children: items.map((meal) => _jsxs("div", { children: [_jsxs("span", { children: [_jsx("b", { children: meal.name }), _jsxs("small", { children: ["P ", meal.protein.toFixed(1), " / F ", meal.fat.toFixed(1), " / C ", meal.carbs.toFixed(1), " g"] })] }), _jsxs("strong", { children: [Math.round(meal.calories), " kcal"] }), _jsxs("div", { children: [_jsx("button", { onClick: () => editMeal(meal), "aria-label": "\u7DE8\u96C6", children: _jsx(Pencil, { size: 16 }) }), _jsx("button", { onClick: () => removeMeal(meal.id), "aria-label": "\u524A\u9664", children: _jsx(Trash2, { size: 16 }) })] })] }, meal.id)) }) })] }, type);
                }) }), formOpen && _jsxs("form", { className: "meal-form redesigned-meal-form", id: "meal-form-fields", onSubmit: saveMeal, children: [_jsxs("label", { children: ["\u533A\u5206", _jsxs("select", { value: mealType, onChange: e => setMealType(e.target.value), children: [_jsx("option", { value: "breakfast", children: "\u671D\u98DF" }), _jsx("option", { value: "lunch", children: "\u663C\u98DF" }), _jsx("option", { value: "dinner", children: "\u5915\u98DF" }), _jsx("option", { value: "snack", children: "\u9593\u98DF" })] })] }), _jsxs("label", { className: "meal-name", children: ["\u98DF\u4E8B\u540D", _jsxs("div", { className: "metric-input", children: [_jsx(Utensils, { size: 18 }), _jsx("input", { value: name, onChange: e => setName(e.target.value), placeholder: "\u4F8B\uFF1A\u9D8F\u3080\u306D\u5B9A\u98DF", maxLength: 80, required: true })] })] }), _jsxs("label", { children: ["kcal", _jsxs("div", { className: "metric-input", children: [_jsx(Flame, { size: 18 }), _jsx("input", { type: "number", inputMode: "numeric", min: "0", max: "10000", value: calories, onChange: e => setCalories(e.target.value), required: true })] })] }), _jsxs("label", { children: ["P", _jsxs("div", { className: "metric-input macro-input", children: [_jsx("input", { type: "number", inputMode: "decimal", min: "0", step: "0.1", value: protein, onChange: e => setProtein(e.target.value), placeholder: "0" }), _jsx("span", { children: "g" })] })] }), _jsxs("label", { children: ["F", _jsxs("div", { className: "metric-input macro-input", children: [_jsx("input", { type: "number", inputMode: "decimal", min: "0", step: "0.1", value: fat, onChange: e => setFat(e.target.value), placeholder: "0" }), _jsx("span", { children: "g" })] })] }), _jsxs("label", { children: ["C", _jsxs("div", { className: "metric-input macro-input", children: [_jsx("input", { type: "number", inputMode: "decimal", min: "0", step: "0.1", value: carbs, onChange: e => setCarbs(e.target.value), placeholder: "0" }), _jsx("span", { children: "g" })] })] }), !editingId && _jsxs("button", { type: "button", className: "secondary-button meal-template-save", onClick: saveTemplate, children: [_jsx(Save, { size: 16 }), "\u3053\u306E\u5185\u5BB9\u3092\u30C6\u30F3\u30D7\u30EC\u4FDD\u5B58"] }), _jsxs("button", { className: "add-button meal-add", disabled: saving, children: [_jsx(Plus, { size: 18 }), saving ? '保存中…' : editingId ? '変更を保存' : '食事を記録'] }), _jsx("button", { type: "button", className: "secondary-button meal-cancel", onClick: () => reset(true), children: editingId ? '編集をキャンセル' : '閉じる' })] }), message && _jsx("p", { className: "record-message", role: "status", children: message })] });
}
function HealthPanel({ exercises, onExerciseAdded, onExerciseRemoved }) {
    const [exercisedOn, setExercisedOn] = useState(isoToday());
    const [name, setName] = useState('MMA / トレーニング');
    const [calories, setCalories] = useState('');
    const [message, setMessage] = useState('');
    async function add(event) { event.preventDefault(); try {
        const result = await api('/exercises', { method: 'POST', body: JSON.stringify({ exercisedOn, name, calories: Number(calories) }) });
        onExerciseAdded(result.exercise);
        setCalories('');
        setMessage('運動消費カロリーを追加しました。');
    }
    catch (caught) {
        setMessage(caught instanceof Error ? caught.message : '保存できませんでした。');
    } }
    async function remove(id) { if (!window.confirm('この運動記録を削除しますか？'))
        return; await api(`/exercises/${id}`, { method: 'DELETE' }); onExerciseRemoved(id); }
    const visible = exercises.filter(x => x.exercisedOn === exercisedOn);
    const total = visible.reduce((s, x) => s + x.calories, 0);
    return _jsxs("div", { className: "panel health-panel", id: "health-exercise", children: [_jsx(PanelHeading, { number: "09", title: "Apple Health\u30FB\u904B\u52D5\u6D88\u8CBB", subtitle: "Web\u7248\u306F\u624B\u5165\u529B\u3002\u5C06\u6765HealthKit\u63A5\u7D9A\u3092\u60F3\u5B9A" }), _jsxs("div", { className: "health-status", children: [_jsx(HeartPulse, { size: 25 }), _jsxs("div", { children: [_jsx("strong", { children: "\u73FE\u5728Web\u7248\u3067\u306FApple Health\u76F4\u63A5\u9023\u643A\u306B\u672A\u5BFE\u5FDC" }), _jsx("p", { children: "\u6B69\u6570\u30FB\u30A2\u30AF\u30C6\u30A3\u30D6\u30A8\u30CD\u30EB\u30AE\u30FC\u30FB\u904B\u52D5\u6D88\u8CBB\u30AB\u30ED\u30EA\u30FC\u3092\u540C\u671F\u3057\u305F\u3088\u3046\u306B\u898B\u305B\u308B\u507D\u6A5F\u80FD\u306F\u4F7F\u7528\u3057\u3066\u3044\u307E\u305B\u3093\u3002iPhone\u30A2\u30D7\u30EA\u5316\u6642\u306BHealthKit\u3078\u63A5\u7D9A\u3067\u304D\u308B\u30C7\u30FC\u30BF\u69CB\u9020\u306B\u3057\u3066\u3044\u307E\u3059\u3002" })] })] }), _jsxs("div", { className: "health-metrics", children: [_jsxs("div", { children: [_jsx(Footprints, { size: 18 }), _jsx("small", { children: "\u6B69\u6570" }), _jsx("b", { children: "\u2014" }), _jsx("span", { children: "HealthKit\u63A5\u7D9A\u5F8C" })] }), _jsxs("div", { children: [_jsx(Activity, { size: 18 }), _jsx("small", { children: "\u30A2\u30AF\u30C6\u30A3\u30D6\u30A8\u30CD\u30EB\u30AE\u30FC" }), _jsx("b", { children: "\u2014" }), _jsx("span", { children: "HealthKit\u63A5\u7D9A\u5F8C" })] }), _jsxs("div", { children: [_jsx(Flame, { size: 18 }), _jsx("small", { children: "\u624B\u5165\u529B\u306E\u904B\u52D5\u6D88\u8CBB" }), _jsxs("b", { children: [Math.round(total).toLocaleString(), " kcal"] }), _jsx("span", { children: formatShortDate(exercisedOn) })] })] }), _jsxs("form", { className: "exercise-form", onSubmit: add, children: [_jsxs("label", { children: ["\u65E5\u4ED8", _jsxs("div", { className: "metric-input", children: [_jsx(CalendarDays, { size: 18 }), _jsx("input", { type: "date", max: isoToday(), value: exercisedOn, onChange: e => setExercisedOn(e.target.value), required: true })] })] }), _jsxs("label", { children: ["\u904B\u52D5\u540D", _jsxs("div", { className: "metric-input", children: [_jsx(Activity, { size: 18 }), _jsx("input", { value: name, onChange: e => setName(e.target.value), maxLength: 80, required: true })] })] }), _jsxs("label", { children: ["\u6D88\u8CBBkcal", _jsxs("div", { className: "metric-input", children: [_jsx(Flame, { size: 18 }), _jsx("input", { type: "number", inputMode: "numeric", min: "1", max: "10000", value: calories, onChange: e => setCalories(e.target.value), required: true })] })] }), _jsxs("button", { className: "add-button", children: [_jsx(Plus, { size: 18 }), "\u904B\u52D5\u3092\u8FFD\u52A0"] })] }), message && _jsx("p", { className: "record-message", children: message }), _jsx("div", { className: "exercise-list", children: visible.map(x => _jsxs("div", { className: "exercise-row", children: [_jsxs("div", { children: [_jsx("strong", { children: x.name }), _jsx("small", { children: "\u624B\u5165\u529B" })] }), _jsxs("b", { children: [Math.round(x.calories).toLocaleString(), " kcal"] }), _jsx("button", { onClick: () => remove(x.id), "aria-label": "\u524A\u9664", children: _jsx(Trash2, { size: 17 }) })] }, x.id)) })] });
}
function PhotoEstimatePanel() {
    const [preview, setPreview] = useState('');
    function choose(event) { const file = event.target.files?.[0]; if (!file)
        return; if (preview)
        URL.revokeObjectURL(preview); setPreview(URL.createObjectURL(file)); }
    useEffect(() => () => { if (preview)
        URL.revokeObjectURL(preview); }, [preview]);
    return _jsxs("div", { className: "panel photo-panel", children: [_jsx(PanelHeading, { number: "10", title: "\u98DF\u4E8B\u5199\u771F\u304B\u3089\u30AB\u30ED\u30EA\u30FC\u63A8\u5B9A", subtitle: "\u753B\u50CFAI\u63A5\u7D9A\u7528\u306E\u753B\u9762\u3092\u5148\u884C\u5B9F\u88C5" }), _jsxs("div", { className: "photo-layout", children: [_jsxs("div", { className: "photo-picker", children: [preview ? _jsx("img", { src: preview, alt: "\u9078\u629E\u3057\u305F\u98DF\u4E8B" }) : _jsx(Camera, { size: 42 }), _jsxs("label", { className: "photo-button", children: [_jsx(Camera, { size: 18 }), "\u98DF\u4E8B\u3092\u64AE\u5F71 / \u5199\u771F\u3092\u9078\u629E", _jsx("input", { type: "file", accept: "image/*", capture: "environment", onChange: choose })] })] }), _jsxs("div", { className: "ai-result", children: [_jsx("span", { className: "coming-badge", children: "AI\u89E3\u6790\u6A5F\u80FD\u306F\u6E96\u5099\u4E2D" }), _jsx("h3", { children: "\u89E3\u6790\u7D50\u679C" }), _jsxs("dl", { children: [_jsxs("div", { children: [_jsx("dt", { children: "\u6599\u7406\u540D" }), _jsx("dd", { children: "\u2014" })] }), _jsxs("div", { children: [_jsx("dt", { children: "\u63A8\u5B9A\u91CF" }), _jsx("dd", { children: "\u2014" })] }), _jsxs("div", { children: [_jsx("dt", { children: "\u63A8\u5B9A\u30AB\u30ED\u30EA\u30FC" }), _jsx("dd", { children: "\u2014" })] })] }), _jsx("p", { children: "\u73FE\u5728\u306EWeb\u74B0\u5883\u3067\u306F\u753B\u50CF\u89E3\u6790API\u3092\u63A5\u7D9A\u3057\u3066\u3044\u306A\u3044\u305F\u3081\u3001\u507D\u306E\u6599\u7406\u540D\u3084\u30AB\u30ED\u30EA\u30FC\u306F\u8868\u793A\u3057\u307E\u305B\u3093\u3002\u5C06\u6765\u3001\u89E3\u6790\u7D50\u679C\u3092\u30E6\u30FC\u30B6\u30FC\u304C\u4FEE\u6B63\u3057\u3066\u304B\u3089\u98DF\u4E8B\u8A18\u9332\u3078\u767B\u9332\u3067\u304D\u308B\u69CB\u9020\u306B\u3057\u307E\u3059\u3002" }), _jsx("small", { children: "\u203B \u753B\u50CF\u304B\u3089\u306E\u30AB\u30ED\u30EA\u30FC\u306F\u63A8\u5B9A\u5024\u3067\u3059\u3002" })] })] })] });
}
function RecordPanel({ records, onRecordSaved, onRecordRemoved, suggestedWeight }) {
    const [weight, setWeight] = useState(String(suggestedWeight));
    const [recordedOn, setRecordedOn] = useState(isoToday());
    const [note, setNote] = useState('');
    const [message, setMessage] = useState('');
    const [saving, setSaving] = useState(false);
    const [historyOpen, setHistoryOpen] = useState(true);
    useEffect(() => setWeight(String(suggestedWeight)), [suggestedWeight]);
    function editRecord(record) {
        setWeight(String(record.weight));
        setRecordedOn(record.recordedOn);
        setNote(record.note || '');
        document.getElementById('daily-record')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    async function addRecord(event) {
        event.preventDefault();
        setMessage('');
        setSaving(true);
        try {
            const result = await api('/records', { method: 'POST', body: JSON.stringify({ weight: Number(weight), recordedOn, note }) });
            onRecordSaved(result.record);
            setNote('');
            setMessage(records.some((record) => record.recordedOn === recordedOn) ? 'この日の記録を更新しました。' : '体重を記録しました。');
        }
        catch (caught) {
            setMessage(caught instanceof Error ? caught.message : '記録できませんでした。');
        }
        finally {
            setSaving(false);
        }
    }
    async function removeRecord(id) {
        if (!window.confirm('この体重記録を削除しますか？'))
            return;
        try {
            await api(`/records/${id}`, { method: 'DELETE' });
            onRecordRemoved(id);
            setMessage('記録を削除しました。');
        }
        catch (caught) {
            setMessage(caught instanceof Error ? caught.message : '削除できませんでした。');
        }
    }
    return (_jsxs("div", { className: "panel record-panel redesigned-record-panel", id: "daily-record", children: [_jsx("div", { className: "section-title record-title", children: _jsxs("div", { children: [_jsx("small", { children: "DAILY RECORD" }), _jsx("h2", { children: "\u4ECA\u65E5\u306E\u4F53\u91CD\u3092\u8A18\u9332" })] }) }), _jsxs("form", { className: "record-form", onSubmit: addRecord, children: [_jsxs("label", { children: ["\u4F53\u91CD", _jsxs("div", { className: "metric-input", children: [_jsx(Weight, { size: 18 }), _jsx("input", { "aria-label": "\u8A18\u9332\u3059\u308B\u4F53\u91CD", type: "number", inputMode: "decimal", min: "30", max: "300", step: "0.1", value: weight, onChange: (event) => setWeight(event.target.value), required: true }), _jsx("span", { children: "kg" })] })] }), _jsxs("label", { children: ["\u65E5\u4ED8", _jsxs("div", { className: "metric-input", children: [_jsx(CalendarDays, { size: 18 }), _jsx("input", { "aria-label": "\u8A18\u9332\u65E5", type: "date", max: isoToday(), value: recordedOn, onChange: (event) => setRecordedOn(event.target.value), required: true })] })] }), _jsxs("label", { className: "note-field", children: ["\u30E1\u30E2\uFF08\u4EFB\u610F\uFF09", _jsx("input", { value: note, onChange: (event) => setNote(event.target.value), placeholder: "\u4F8B\uFF1A\u671D\u30FB\u8D77\u5E8A\u5F8C\u3001\u4F53\u8ABF\u826F\u597D", maxLength: 120 })] }), _jsxs("button", { className: "add-button", disabled: saving, children: [_jsx(Plus, { size: 18 }), saving ? '保存中…' : records.some((record) => record.recordedOn === recordedOn) ? 'この日を更新' : '記録する'] })] }), message && _jsx("p", { className: "record-message", role: "status", children: message }), _jsxs("button", { className: "history-toggle", onClick: () => setHistoryOpen((open) => !open), children: [_jsxs("span", { children: ["\u4F53\u91CD\u5C65\u6B74 ", _jsxs("b", { children: [records.length, "\u4EF6"] })] }), historyOpen ? _jsx(ChevronUp, { size: 20 }) : _jsx(ChevronDown, { size: 20 })] }), historyOpen && _jsx("div", { className: "record-list", children: records.length === 0 ? _jsxs("div", { className: "empty-record", children: [_jsx(TrendingDown, { size: 28 }), _jsx("p", { children: "\u6700\u521D\u306E\u4F53\u91CD\u3092\u8A18\u9332\u3059\u308B\u3068\u3001\u3053\u3053\u306B\u63A8\u79FB\u304C\u8868\u793A\u3055\u308C\u307E\u3059\u3002" })] }) : records.map((record, index) => {
                    const previous = records[index + 1];
                    const delta = previous ? record.weight - previous.weight : 0;
                    return _jsxs("div", { className: "record-row", children: [_jsx("time", { children: formatShortDate(record.recordedOn) }), _jsxs("div", { children: [_jsxs("b", { children: [record.weight.toFixed(1), " kg"] }), record.note && _jsx("small", { children: record.note })] }), _jsx("span", { className: delta <= 0 ? 'down' : 'up', children: previous ? `${delta > 0 ? '+' : ''}${delta.toFixed(1)}` : '—' }), _jsxs("div", { className: "record-actions", children: [_jsx("button", { onClick: () => editRecord(record), "aria-label": `${formatShortDate(record.recordedOn)}の記録を編集`, children: _jsx(Pencil, { size: 16 }) }), _jsx("button", { onClick: () => removeRecord(record.id), "aria-label": `${formatShortDate(record.recordedOn)}の記録を削除`, children: _jsx(Trash2, { size: 16 }) })] })] }, record.id);
                }) })] }));
}
function FeedbackPanel() {
    const [category, setCategory] = useState('使いやすさ');
    const [message, setMessage] = useState('');
    const [notice, setNotice] = useState('');
    const [sending, setSending] = useState(false);
    async function submit(event) {
        event.preventDefault();
        setNotice('');
        setSending(true);
        try {
            const result = await api('/feedback', { method: 'POST', body: JSON.stringify({ category, message }) });
            setMessage('');
            setNotice(result.message);
        }
        catch (caught) {
            setNotice(caught instanceof Error ? caught.message : '送信できませんでした。');
        }
        finally {
            setSending(false);
        }
    }
    return (_jsxs("div", { className: "panel feedback-panel", children: [_jsx(PanelHeading, { number: "08", title: "\u3054\u610F\u898B\u30FB\u3054\u8981\u671B", subtitle: "\u30C6\u30B9\u30C8\u7248\u306E\u6539\u5584\u306B\u6D3B\u7528\u3057\u307E\u3059" }), _jsxs("form", { onSubmit: submit, children: [_jsxs("label", { children: ["\u7A2E\u985E", _jsxs("select", { value: category, onChange: (event) => setCategory(event.target.value), children: [_jsx("option", { children: "\u4F7F\u3044\u3084\u3059\u3055" }), _jsx("option", { children: "\u6A5F\u80FD\u306E\u8981\u671B" }), _jsx("option", { children: "\u4E0D\u5177\u5408" }), _jsx("option", { children: "\u305D\u306E\u4ED6" })] })] }), _jsxs("label", { children: ["\u5185\u5BB9", _jsx("textarea", { value: message, onChange: (event) => setMessage(event.target.value), placeholder: "\u4F7F\u3044\u306B\u304F\u304B\u3063\u305F\u70B9\u3084\u3001\u6B32\u3057\u3044\u6A5F\u80FD\u3092\u6559\u3048\u3066\u304F\u3060\u3055\u3044\u3002", minLength: 3, maxLength: 1000, required: true })] }), _jsxs("button", { className: "feedback-button", disabled: sending, children: [_jsx(MessageSquareText, { size: 18 }), sending ? '送信中…' : '意見を送信'] })] }), notice && _jsx("p", { className: "feedback-notice", role: "status", children: notice })] }));
}
function formatDate(value) {
    return new Intl.DateTimeFormat('ja-JP', { year: 'numeric', month: 'short', day: 'numeric' }).format(dateAtNoon(value));
}
function formatShortDate(value) {
    return new Intl.DateTimeFormat('ja-JP', { month: '2-digit', day: '2-digit' }).format(dateAtNoon(value));
}
function formatChartDate(value) {
    return new Intl.DateTimeFormat('ja-JP', { month: 'numeric', day: 'numeric' }).format(value);
}
