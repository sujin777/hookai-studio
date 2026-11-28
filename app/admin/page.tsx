'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';

interface CustomerRecord {
  email: string;
  interior_credits: number;
  contract_credits: number;
  created_at: string;
  updated_at: string;
}

interface PaymentRecord {
  transaction_id: string;
  email: string;
  app_type: string;
  credits_added: number;
  created_at: string;
}

interface OverviewState {
  source: 'supabase' | 'memory';
  warning?: string;
  totalCustomers: number;
  totalPayments: number;
  totalInteriorCredits: number;
  totalContractCredits: number;
  todayFreeUsage: number;
  payments: PaymentRecord[];
}

interface BoardPost {
  id: string;
  author_email: string;
  category: 'feature' | 'interior' | 'contract';
  title: string;
  content: string;
  image_data?: string | null;
  admin_reply?: string | null;
  admin_replied_at?: string | null;
  created_at: string;
}

const BOARD_CATEGORY_LABELS: Record<BoardPost['category'], string> = {
  feature: '추가기능',
  interior: '인테리어AI',
  contract: '계약서 스캐너',
};

export default function AdminDashboardPage() {
  const [authChecked, setAuthChecked] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);

  const [tab, setTab] = useState<'customers' | 'payments' | 'board'>('customers');
  const [customers, setCustomers] = useState<CustomerRecord[]>([]);
  const [overview, setOverview] = useState<OverviewState | null>(null);
  const [boardPosts, setBoardPosts] = useState<BoardPost[]>([]);
  const [replyTargetId, setReplyTargetId] = useState<string | null>(null);
  const [replyDraft, setReplyDraft] = useState('');
  const [savingReply, setSavingReply] = useState(false);
  const [boardNotice, setBoardNotice] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingData, setLoadingData] = useState(false);
  const [actionMsg, setActionMsg] = useState('');
  const [actionErr, setActionErr] = useState('');

  // Create customer form
  const [newEmail, setNewEmail] = useState('');
  const [newInterior, setNewInterior] = useState(10);
  const [newContract, setNewContract] = useState(0);

  // Inline edit state
  const [editingEmail, setEditingEmail] = useState<string | null>(null);
  const [editInterior, setEditInterior] = useState(0);
  const [editContract, setEditContract] = useState(0);

  const loadDashboard = useCallback(async (q = '') => {
    setLoadingData(true);
    setActionErr('');
    try {
      const [custRes, payRes, boardRes] = await Promise.all([
        fetch(`/api/admin/customers?q=${encodeURIComponent(q)}`),
        fetch('/api/admin/payments'),
        fetch('/api/board?category=all'),
      ]);
      if (custRes.status === 401 || payRes.status === 401) {
        setAuthenticated(false);
        return;
      }
      const custData = await custRes.json();
      const payData = await payRes.json();
      const boardData = await boardRes.json();
      if (custData.ok) setCustomers(custData.customers || []);
      if (payData.ok) setOverview(payData);
      if (boardData.ok) setBoardPosts(boardData.posts || []);
    } catch {
      setActionErr('데이터를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoadingData(false);
    }
  }, []);

  const handleSaveBoardReply = async (id: string) => {
    setSavingReply(true);
    setBoardNotice('');
    setActionErr('');
    try {
      const res = await fetch('/api/board', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, reply: replyDraft }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setActionErr(data.error || '답변 저장에 실패했습니다.');
        return;
      }
      setReplyTargetId(null);
      setReplyDraft('');
      if (data.emailNotification?.sent) {
        setBoardNotice(`답변이 저장되었으며 작성자(${data.post?.author_email})에게 안내 메일이 자동 발송되었습니다.`);
      } else if (data.emailNotification && !data.emailNotification.sent) {
        setBoardNotice(`답변은 저장되었으나 메일 발송에 실패했습니다: ${data.emailNotification.error}`);
      } else {
        setBoardNotice('답변이 저장되었습니다.');
      }
      loadDashboard();
    } catch {
      setActionErr('답변 저장 중 네트워크 오류가 발생했습니다.');
    } finally {
      setSavingReply(false);
    }
  };

  const handleDeleteBoardPost = async (id: string) => {
    if (!confirm('이 게시글을 삭제하시겠습니까?')) return;
    setActionErr('');
    const res = await fetch('/api/board', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    if (res.ok) {
      setBoardNotice('게시글이 삭제되었습니다.');
      loadDashboard();
    } else {
      const data = await res.json().catch(() => ({}));
      setActionErr(data.error || '게시글 삭제에 실패했습니다.');
    }
  };

  useEffect(() => {
    fetch('/api/admin/auth')
      .then((r) => r.json())
      .then((d) => {
        setAuthenticated(Boolean(d.authenticated));
        setAuthChecked(true);
        if (d.authenticated) {
          loadDashboard();
        }
      })
      .catch(() => setAuthChecked(true));
  }, [loadDashboard]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoggingIn(true);
    setLoginError('');
    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setAuthenticated(true);
        setPassword('');
        loadDashboard();
      } else {
        setLoginError(data.error || '비밀번호가 올바르지 않습니다.');
      }
    } catch {
      setLoginError('로그인 요청 중 오류가 발생했습니다.');
    } finally {
      setLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/admin/auth', { method: 'DELETE' });
    setAuthenticated(false);
    setCustomers([]);
    setOverview(null);
  };

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionMsg('');
    setActionErr('');
    try {
      const res = await fetch('/api/admin/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: newEmail,
          interior_credits: newInterior,
          contract_credits: newContract,
        }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setActionMsg(`고객 등록 완료: ${data.customer.email}`);
        setNewEmail('');
        setNewInterior(10);
        setNewContract(0);
        loadDashboard(searchQuery);
      } else {
        setActionErr(data.error || '고객 등록 실패');
      }
    } catch {
      setActionErr('고객 등록 중 네트워크 오류가 발생했습니다.');
    }
  };

  const startEdit = (c: CustomerRecord) => {
    setEditingEmail(c.email);
    setEditInterior(c.interior_credits);
    setEditContract(c.contract_credits);
  };

  const handleSaveEdit = async (email: string) => {
    setActionMsg('');
    setActionErr('');
    try {
      const res = await fetch('/api/admin/customers', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          interior_credits: editInterior,
          contract_credits: editContract,
        }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setActionMsg(`고객 수정 완료: ${email}`);
        setEditingEmail(null);
        loadDashboard(searchQuery);
      } else {
        setActionErr(data.error || '수정 실패');
      }
    } catch {
      setActionErr('수정 중 네트워크 오류가 발생했습니다.');
    }
  };

  const handleDeleteCustomer = async (email: string) => {
    if (!confirm(`정말 고객(${email})을 삭제하시겠습니까?`)) return;
    setActionMsg('');
    setActionErr('');
    try {
      const res = await fetch('/api/admin/customers', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setActionMsg(`고객 삭제 완료: ${email}`);
        loadDashboard(searchQuery);
      } else {
        setActionErr(data.error || '삭제 실패');
      }
    } catch {
      setActionErr('삭제 중 네트워크 오류가 발생했습니다.');
    }
  };

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center text-sm text-zinc-500">
        Checking admin session...
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] text-zinc-900 flex flex-col">
        <header className="border-b border-zinc-200/70 bg-white/80 backdrop-blur-md">
          <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5 text-sm font-bold text-zinc-950">
              <span className="w-7 h-7 rounded-lg bg-zinc-950 text-white flex items-center justify-center font-black text-xs">
                H
              </span>
              HookAI Studio
            </Link>
            <span className="text-xs font-semibold text-zinc-400">Admin Console</span>
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center px-4">
          <form
            onSubmit={handleLogin}
            className="w-full max-w-sm bg-white rounded-3xl border border-zinc-200/90 p-7 shadow-xs space-y-5"
          >
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600">
                HookAI Admin
              </span>
              <h1 className="text-2xl font-extrabold text-zinc-950 mt-1">관리자 로그인</h1>
              <p className="text-xs text-zinc-500 mt-1">
                고객 크레딧 관리 및 Paddle 결제 내역을 확인합니다.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-700 block">관리자 비밀번호</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="ADMIN_PASSWORD 입력 (로컬 기본: admin1234)"
                className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
              />
            </div>

            {loginError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700">
                {loginError}
              </div>
            )}

            <button
              type="submit"
              disabled={loggingIn}
              className="w-full py-3 rounded-xl bg-zinc-950 text-white text-sm font-bold hover:bg-zinc-800 disabled:opacity-50 transition cursor-pointer"
            >
              {loggingIn ? '확인 중...' : '관리자 콘솔 입장'}
            </button>
          </form>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-zinc-900 flex flex-col">
      <header className="sticky top-0 z-30 border-b border-zinc-200/70 bg-white/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-500 hover:text-zinc-950"
            >
              <span className="w-7 h-7 rounded-lg bg-zinc-950 text-white flex items-center justify-center font-black text-xs">
                H
              </span>
              <span className="hidden sm:inline">← HookAI Studio</span>
            </Link>
            <span className="text-zinc-200">/</span>
            <span className="font-bold text-sm text-zinc-950">관리자 콘솔 (고객 · 결제)</span>
            {overview && (
              <span
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                  overview.source === 'supabase'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                }`}
              >
                {overview.source === 'supabase' ? 'Supabase DB 연결됨' : '로컬 메모리 모드'}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => loadDashboard(searchQuery)}
              className="px-3 py-1.5 rounded-lg border border-zinc-200 bg-white text-xs font-semibold text-zinc-700 hover:bg-zinc-50 cursor-pointer"
            >
              새로고침
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="px-3 py-1.5 rounded-lg bg-zinc-950 text-white text-xs font-bold hover:bg-zinc-800 cursor-pointer"
            >
              로그아웃
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto w-full px-4 sm:px-6 py-8 space-y-6 flex-1">
        {/* KPI Cards */}
        <section className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
          <div className="bg-white rounded-2xl border border-zinc-200/90 p-4 shadow-2xs">
            <div className="text-[11px] font-bold text-zinc-400 uppercase">총 등록 고객</div>
            <div className="text-2xl font-black text-zinc-950 mt-1">
              {overview?.totalCustomers ?? 0}
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-zinc-200/90 p-4 shadow-2xs">
            <div className="text-[11px] font-bold text-zinc-400 uppercase">Paddle 결제 건수</div>
            <div className="text-2xl font-black text-indigo-600 mt-1">
              {overview?.totalPayments ?? 0}
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-zinc-200/90 p-4 shadow-2xs">
            <div className="text-[11px] font-bold text-zinc-400 uppercase">인테리어 잔여 크레딧</div>
            <div className="text-2xl font-black text-emerald-600 mt-1">
              {overview?.totalInteriorCredits ?? 0}
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-zinc-200/90 p-4 shadow-2xs">
            <div className="text-[11px] font-bold text-zinc-400 uppercase">계약서 잔여 크레딧</div>
            <div className="text-2xl font-black text-zinc-950 mt-1">
              {overview?.totalContractCredits ?? 0}
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-zinc-200/90 p-4 shadow-2xs col-span-2 lg:col-span-1">
            <div className="text-[11px] font-bold text-zinc-400 uppercase">오늘 무료 체험</div>
            <div className="text-2xl font-black text-zinc-700 mt-1">
              {overview?.todayFreeUsage ?? 0}
            </div>
          </div>
        </section>

        {/* Feedback Banners */}
        {overview?.warning && (
          <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs font-bold text-amber-900">
            {overview.warning}
          </div>
        )}
        {actionMsg && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800">
            {actionMsg}
          </div>
        )}
        {actionErr && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-700">
            {actionErr}
          </div>
        )}

        {/* Section Tabs */}
        <div className="inline-flex rounded-xl bg-zinc-200/70 p-1 text-xs font-bold">
          <button
            type="button"
            onClick={() => setTab('customers')}
            className={`px-4 py-2 rounded-lg transition cursor-pointer ${
              tab === 'customers' ? 'bg-white text-zinc-950 shadow-2xs' : 'text-zinc-600'
            }`}
          >
            고객 관리 (등록 · 수정 · 삭제)
          </button>
          <button
            type="button"
            onClick={() => setTab('payments')}
            className={`px-4 py-2 rounded-lg transition cursor-pointer ${
              tab === 'payments' ? 'bg-white text-zinc-950 shadow-2xs' : 'text-zinc-600'
            }`}
          >
            Paddle 결제 내역 ({overview?.payments.length ?? 0})
          </button>
          <button
            type="button"
            onClick={() => setTab('board')}
            className={`px-4 py-2 rounded-lg transition cursor-pointer ${
              tab === 'board' ? 'bg-white text-zinc-950 shadow-2xs' : 'text-zinc-600'
            }`}
          >
            게시판 관리 / 답변 ({boardPosts.length})
          </button>
        </div>

        {tab === 'customers' ? (
          <div className="space-y-6">
            {/* Register Customer Form */}
            <form
              onSubmit={handleCreateCustomer}
              className="bg-white rounded-3xl border border-zinc-200/90 p-5 sm:p-6 shadow-xs space-y-4"
            >
              <h2 className="text-sm font-extrabold text-zinc-950">신규 고객 등록 / 크레딧 부여</h2>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="customer@example.com"
                  className="sm:col-span-2 px-3.5 py-2.5 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
                />
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-zinc-500 shrink-0">인테리어</span>
                  <input
                    type="number"
                    min={0}
                    value={newInterior}
                    onChange={(e) => setNewInterior(Number(e.target.value))}
                    className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 text-sm"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-zinc-500 shrink-0">계약서</span>
                  <input
                    type="number"
                    min={0}
                    value={newContract}
                    onChange={(e) => setNewContract(Number(e.target.value))}
                    className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 text-sm"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-zinc-950 text-white text-xs font-bold hover:bg-emerald-600 transition cursor-pointer"
              >
                + 고객 등록
              </button>
            </form>

            {/* Customer List & Search */}
            <div className="bg-white rounded-3xl border border-zinc-200/90 p-5 sm:p-6 shadow-xs space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-sm font-extrabold text-zinc-950">
                  등록 고객 목록 ({customers.length})
                </h2>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="이메일 검색..."
                    className="px-3 py-1.5 rounded-xl border border-zinc-200 text-xs w-48 sm:w-64"
                  />
                  <button
                    type="button"
                    onClick={() => loadDashboard(searchQuery)}
                    className="px-3 py-1.5 rounded-xl bg-zinc-100 text-xs font-bold text-zinc-800 hover:bg-zinc-200 cursor-pointer"
                  >
                    검색
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-zinc-200 text-zinc-400 uppercase">
                      <th className="py-3 pr-4">이메일</th>
                      <th className="py-3 px-3">인테리어 크레딧</th>
                      <th className="py-3 px-3">계약서 크레딧</th>
                      <th className="py-3 px-3">최근 수정</th>
                      <th className="py-3 pl-3 text-right">관리</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {customers.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-zinc-400">
                          {loadingData ? '불러오는 중...' : '등록된 고객이 없습니다.'}
                        </td>
                      </tr>
                    ) : (
                      customers.map((c) => {
                        const isEditing = editingEmail === c.email;
                        return (
                          <tr key={c.email} className="hover:bg-zinc-50/70">
                            <td className="py-3 pr-4 font-semibold text-zinc-900">{c.email}</td>
                            <td className="py-3 px-3">
                              {isEditing ? (
                                <input
                                  type="number"
                                  min={0}
                                  value={editInterior}
                                  onChange={(e) => setEditInterior(Number(e.target.value))}
                                  className="w-20 px-2 py-1 rounded-lg border border-zinc-300"
                                />
                              ) : (
                                <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold">
                                  {c.interior_credits}
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-3">
                              {isEditing ? (
                                <input
                                  type="number"
                                  min={0}
                                  value={editContract}
                                  onChange={(e) => setEditContract(Number(e.target.value))}
                                  className="w-20 px-2 py-1 rounded-lg border border-zinc-300"
                                />
                              ) : (
                                <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-bold">
                                  {c.contract_credits}
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-3 text-zinc-400">
                              {new Date(c.updated_at).toLocaleString('ko-KR')}
                            </td>
                            <td className="py-3 pl-3 text-right space-x-2 whitespace-nowrap">
                              {isEditing ? (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => handleSaveEdit(c.email)}
                                    className="px-2.5 py-1 rounded-lg bg-zinc-950 text-white font-bold cursor-pointer"
                                  >
                                    저장
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setEditingEmail(null)}
                                    className="px-2.5 py-1 rounded-lg border border-zinc-200 text-zinc-600 font-semibold cursor-pointer"
                                  >
                                    취소
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => startEdit(c)}
                                    className="px-2.5 py-1 rounded-lg border border-zinc-200 text-zinc-700 font-semibold hover:bg-zinc-100 cursor-pointer"
                                  >
                                    수정
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteCustomer(c.email)}
                                    className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-600 font-bold hover:bg-rose-100 cursor-pointer"
                                  >
                                    삭제
                                  </button>
                                </>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : tab === 'payments' ? (
          <div className="bg-white rounded-3xl border border-zinc-200/90 p-5 sm:p-6 shadow-xs space-y-4">
            <h2 className="text-sm font-extrabold text-zinc-950">
              Paddle 결제 내역 ({overview?.payments.length ?? 0})
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-zinc-200 text-zinc-400 uppercase">
                    <th className="py-3 pr-4">트랜잭션 ID</th>
                    <th className="py-3 px-3">고객 이메일</th>
                    <th className="py-3 px-3">상품 구분</th>
                    <th className="py-3 px-3">지급 크레딧</th>
                    <th className="py-3 pl-3">결제 일시</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {!overview || overview.payments.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-zinc-400">
                        결제 완료 내역이 아직 없습니다. (Paddle 웹훅 수신 시 자동 기록됩니다.)
                      </td>
                    </tr>
                  ) : (
                    overview.payments.map((p) => (
                      <tr key={p.transaction_id} className="hover:bg-zinc-50/70">
                        <td className="py-3 pr-4 font-mono text-[11px] text-zinc-600">
                          {p.transaction_id}
                        </td>
                        <td className="py-3 px-3 font-semibold text-zinc-900">{p.email}</td>
                        <td className="py-3 px-3">
                          <span
                            className={`px-2 py-0.5 rounded-full font-bold ${
                              p.app_type === 'interior'
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-indigo-50 text-indigo-700'
                            }`}
                          >
                            {p.app_type === 'interior' ? 'RoomTransform ($10.90)' : 'ClauseGuard ($14.90)'}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-bold text-zinc-900">+{p.credits_added}</td>
                        <td className="py-3 pl-3 text-zinc-400">
                          {new Date(p.created_at).toLocaleString('ko-KR')}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-zinc-200/90 p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-sm font-extrabold text-zinc-950">
                커뮤니티 게시판 관리 / 관리자 답변 ({boardPosts.length})
              </h2>
              <Link
                href="/board"
                className="text-xs font-bold text-emerald-700 hover:underline"
              >
                게시판 바로가기 →
              </Link>
            </div>

            {boardNotice && (
              <div className="px-4 py-3 rounded-2xl border border-emerald-200 bg-emerald-50 text-xs font-bold text-emerald-800">
                {boardNotice}
              </div>
            )}

            {boardPosts.length === 0 ? (
              <div className="py-10 text-center text-xs text-zinc-400">
                등록된 게시글이 없습니다.
              </div>
            ) : (
              <div className="space-y-4">
                {boardPosts.map((post) => (
                  <div
                    key={post.id}
                    className="rounded-2xl border border-zinc-200 p-4 sm:p-5 space-y-3 bg-zinc-50/40"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full bg-zinc-900 text-white text-[11px] font-bold">
                          {BOARD_CATEGORY_LABELS[post.category] || post.category}
                        </span>
                        <span className="text-xs font-bold text-zinc-700">
                          {post.author_email}
                        </span>
                        {post.admin_reply && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold">
                            답변완료
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[11px] text-zinc-400">
                          {new Date(post.created_at).toLocaleString('ko-KR')}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            if (replyTargetId === post.id) {
                              setReplyTargetId(null);
                              setReplyDraft('');
                            } else {
                              setReplyTargetId(post.id);
                              setReplyDraft(post.admin_reply || '');
                              setBoardNotice('');
                            }
                          }}
                          className="text-xs font-bold text-emerald-700 hover:underline cursor-pointer"
                        >
                          {post.admin_reply ? '답변 수정' : '답변 달기'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteBoardPost(post.id)}
                          className="text-xs font-bold text-rose-600 hover:underline cursor-pointer"
                        >
                          삭제
                        </button>
                      </div>
                    </div>

                    <div>
                      <div className="text-sm font-extrabold text-zinc-950">{post.title}</div>
                      <p className="mt-1 text-xs text-zinc-600 whitespace-pre-wrap leading-relaxed">
                        {post.content}
                      </p>
                    </div>

                    {post.image_data && (
                      <img
                        src={post.image_data}
                        alt={post.title}
                        className="max-h-48 rounded-xl border border-zinc-200 object-contain bg-white"
                      />
                    )}

                    {post.admin_reply && (
                      <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-3 space-y-1">
                        <div className="flex items-center justify-between text-[11px] font-bold text-emerald-800">
                          <span>관리자 답변</span>
                          {post.admin_replied_at && (
                            <span className="text-emerald-600">
                              {new Date(post.admin_replied_at).toLocaleString('ko-KR')}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-emerald-950 whitespace-pre-wrap leading-relaxed">
                          {post.admin_reply}
                        </p>
                      </div>
                    )}

                    {replyTargetId === post.id && (
                      <div className="rounded-xl border border-zinc-200 bg-white p-3.5 space-y-2.5">
                        <div className="text-[11px] font-bold text-zinc-600">
                          저장 시 작성자({post.author_email})에게 답변 알림 메일이 자동 발송됩니다.
                        </div>
                        <textarea
                          rows={3}
                          value={replyDraft}
                          onChange={(e) => setReplyDraft(e.target.value)}
                          placeholder="관리자 답변 내용을 입력하세요 (비우고 저장하면 답변이 삭제됩니다)."
                          className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-xs focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
                        />
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            disabled={savingReply}
                            onClick={() => handleSaveBoardReply(post.id)}
                            className="px-4 py-2 rounded-xl bg-zinc-950 text-white text-xs font-bold hover:bg-emerald-600 transition cursor-pointer disabled:opacity-50"
                          >
                            {savingReply ? '저장 · 메일 발송 중...' : '답변 저장 · 메일 발송'}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setReplyTargetId(null);
                              setReplyDraft('');
                            }}
                            className="px-4 py-2 rounded-xl border border-zinc-200 text-xs font-bold text-zinc-600 hover:bg-zinc-50 transition cursor-pointer"
                          >
                            취소
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
