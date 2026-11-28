'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { PaddleBar } from '@/components/PaddleBar';
import { useLanguage } from '@/components/LanguageProvider';

type BoardCategory = 'feature' | 'interior' | 'contract';

interface BoardPost {
  id: string;
  author_email: string;
  category: BoardCategory;
  title: string;
  content: string;
  image_data?: string | null;
  is_active?: boolean;
  admin_reply?: string | null;
  admin_replied_at?: string | null;
  created_at: string;
}

function compressBoardImage(file: File, maxDim = 1200, quality = 0.84): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Invalid image file.'));
      img.onload = () => {
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        const width = Math.round(img.width * scale);
        const height = Math.round(img.height * scale);
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(reader.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

function maskEmail(email: string): string {
  const [name, domain] = email.split('@');
  if (!name || !domain) return email;
  const visible = name.slice(0, 3);
  return `${visible}***@${domain}`;
}

export default function BoardPage() {
  const { locale } = useLanguage();
  const [email, setEmail] = useState('');
  const [filterCat, setFilterCat] = useState<'all' | BoardCategory>('all');
  const [posts, setPosts] = useState<BoardPost[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [replyTargetId, setReplyTargetId] = useState<string | null>(null);
  const [replyDraft, setReplyDraft] = useState('');
  const [savingReply, setSavingReply] = useState(false);
  const [replyNotice, setReplyNotice] = useState('');

  // Composer state
  const [category, setCategory] = useState<BoardCategory>('feature');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [imageData, setImageData] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [formMsg, setFormMsg] = useState('');
  const [formErr, setFormErr] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const CATEGORIES: Array<{ id: BoardCategory; label: string; badgeClass: string }> = [
    {
      id: 'feature',
      label: locale === 'ko' ? '✨ 추가기능' : locale === 'ja' ? '✨ 追加機能' : locale === 'es' ? '✨ Nueva Función' : locale === 'zh' ? '✨ 新功能建议' : '✨ Feature Request',
      badgeClass: 'bg-amber-50 text-amber-700 border-amber-200/80',
    },
    {
      id: 'interior',
      label: locale === 'ko' ? '🛋️ 인테리어AI' : locale === 'ja' ? '🛋️ インテリアAI' : locale === 'es' ? '🛋️ Interiores IA' : locale === 'zh' ? '🛋️ 室内设计AI' : '🛋️ Interior AI',
      badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
    },
    {
      id: 'contract',
      label: locale === 'ko' ? '🛡️ 계약서 스캐너' : locale === 'ja' ? '🛡️ 契約書スキャナー' : locale === 'es' ? '🛡️ Escáner Legal' : locale === 'zh' ? '🛡️ 合同扫描器' : '🛡️ Contract Scanner',
      badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200/80',
    },
  ];

  const getCategoryMeta = (cat: BoardCategory) =>
    CATEGORIES.find((c) => c.id === cat) || CATEGORIES[0];

  const loadPosts = useCallback(async (cat: 'all' | BoardCategory) => {
    setLoadingPosts(true);
    try {
      const res = await fetch(`/api/board?category=${cat}`);
      const data = await res.json();
      if (data.ok) {
        setPosts(data.posts || []);
        setIsAdmin(Boolean(data.isAdmin));
      }
    } finally {
      setLoadingPosts(false);
    }
  }, []);

  useEffect(() => {
    loadPosts(filterCat);
  }, [filterCat, loadPosts]);

  const handleImagePick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFormErr('');
    try {
      const compressed = await compressBoardImage(file);
      setImageData(compressed);
    } catch {
      setFormErr(locale === 'ko' ? '이미지를 처리할 수 없습니다.' : 'Could not process image.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErr('');
    setFormMsg('');
    if (!email) {
      setFormErr(
        locale === 'ko'
          ? '상단의 "로그인 / 가입" 버튼으로 먼저 로그인해 주세요.'
          : 'Please sign in from the top bar first.'
      );
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/board', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, title, content, imageData }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setTitle('');
        setContent('');
        setImageData('');
        setFormMsg(locale === 'ko' ? '게시글이 등록되었습니다!' : 'Post published!');
        loadPosts(filterCat);
      } else {
        setFormErr(data.error || 'Failed to publish post.');
      }
    } catch {
      setFormErr(locale === 'ko' ? '등록 중 네트워크 오류가 발생했습니다.' : 'Network error.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(locale === 'ko' ? '이 게시글을 삭제하시겠습니까?' : 'Delete this post?')) return;
    const res = await fetch('/api/board', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    if (res.ok) {
      loadPosts(filterCat);
    }
  };

  const handleTogglePostActive = async (id: string, isActive: boolean) => {
    setReplyNotice('');
    const res = await fetch('/api/board', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, isActive }),
    });
    const data = await res.json();
    if (res.ok && data.ok) {
      setReplyNotice(
        locale === 'ko'
          ? isActive
            ? '게시글이 활성화되었습니다.'
            : '게시글이 비활성화되어 게시판에서 숨겨졌습니다.'
          : isActive
            ? 'Post enabled.'
            : 'Post hidden from board.'
      );
      loadPosts(filterCat);
    } else {
      setReplyNotice(data.error || 'Failed to update post status.');
    }
  };

  const handleSaveReply = async (id: string) => {
    setSavingReply(true);
    setReplyNotice('');
    try {
      const res = await fetch('/api/board', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, reply: replyDraft }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setReplyTargetId(null);
        setReplyDraft('');
        if (data.emailNotification?.sent) {
          setReplyNotice(
            locale === 'ko'
              ? '답변이 저장되었으며 작성자 이메일로 자동 발송되었습니다.'
              : 'Reply saved and emailed to the author.'
          );
        } else if (data.emailNotification && !data.emailNotification.sent) {
          setReplyNotice(
            locale === 'ko'
              ? `답변은 저장되었으나 이메일 발송에 실패했습니다: ${data.emailNotification.error}`
              : `Reply saved, but email failed: ${data.emailNotification.error}`
          );
        } else {
          setReplyNotice(locale === 'ko' ? '답변이 저장되었습니다.' : 'Reply saved.');
        }
        loadPosts(filterCat);
      } else {
        setReplyNotice(data.error || 'Failed to save reply.');
      }
    } finally {
      setSavingReply(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-zinc-900 flex flex-col">
      <PaddleBar
        appName={locale === 'ko' ? '커뮤니티 게시판' : 'Community Board'}
        priceId=""
        priceLabel=""
        email={email}
        onEmailChange={setEmail}
        remainingCredits={null}
        targetPath="/board"
        hideCheckout
      />

      <main className="max-w-4xl mx-auto w-full px-4 sm:px-6 py-8 space-y-6 flex-1">
        {/* Write Post Card */}
        <section className="bg-white rounded-3xl border border-zinc-200/90 p-5 sm:p-7 shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600">
                HookAI Community &amp; Feedback
              </span>
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-zinc-950 mt-0.5">
                {locale === 'ko' ? '의견 · 후기 · 추가기능 요청' : 'Feedback & Feature Board'}
              </h1>
            </div>
            {!email && (
              <span className="px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-xs font-bold text-amber-800">
                {locale === 'ko'
                  ? '상단 "로그인 / 가입" 후 글 작성 가능'
                  : 'Sign in at top bar to post'}
              </span>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Category Selector */}
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategory(cat.id)}
                  className={`px-3.5 py-2 rounded-xl border text-xs font-bold transition cursor-pointer ${
                    category === cat.id
                      ? 'border-zinc-950 bg-zinc-950 text-white shadow-2xs'
                      : 'border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            <input
              type="text"
              required
              minLength={2}
              maxLength={120}
              disabled={!email}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={
                locale === 'ko'
                  ? email
                    ? '제목을 입력하세요...'
                    : '로그인 후 제목을 입력할 수 있습니다.'
                  : 'Enter post title...'
              }
              className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50/50 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900/10 disabled:opacity-60"
            />

            <textarea
              rows={4}
              required
              minLength={2}
              disabled={!email}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={
                locale === 'ko'
                  ? '원하는 추가기능, 인테리어AI 사용 후기, 계약서 스캐너 개선 의견 등을 자유롭게 남겨주세요.'
                  : 'Share feature requests, Interior AI results, or Contract Scanner feedback...'
              }
              className="w-full p-4 rounded-2xl border border-zinc-200 bg-zinc-50/50 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900/10 disabled:opacity-60"
            />

            {imageData && (
              <div className="relative inline-block rounded-2xl overflow-hidden border border-zinc-200 bg-zinc-50">
                <img
                  src={imageData}
                  alt="Attached preview"
                  className="max-h-48 object-contain"
                />
                <button
                  type="button"
                  onClick={() => setImageData('')}
                  className="absolute top-2 right-2 w-7 h-7 rounded-full bg-zinc-950/80 text-white text-xs font-black flex items-center justify-center hover:bg-zinc-950 cursor-pointer"
                >
                  ✕
                </button>
              </div>
            )}

            {formErr && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-700">
                {formErr}
              </div>
            )}
            {formMsg && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-700">
                {formMsg}
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImagePick}
                  className="hidden"
                />
                <button
                  type="button"
                  disabled={!email}
                  onClick={() => fileRef.current?.click()}
                  className="px-3.5 py-2 rounded-xl border border-zinc-200 bg-white text-xs font-bold text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 transition cursor-pointer"
                >
                  {locale === 'ko' ? '📷 사진 첨부' : '📷 Attach Photo'}
                </button>
              </div>

              <button
                type="submit"
                disabled={!email || submitting}
                className="px-5 py-2.5 rounded-xl bg-zinc-950 text-white text-xs font-bold hover:bg-emerald-600 disabled:opacity-40 transition cursor-pointer"
              >
                {submitting
                  ? locale === 'ko'
                    ? '등록 중...'
                    : 'Posting...'
                  : locale === 'ko'
                  ? '게시글 등록'
                  : 'Publish Post'}
              </button>
            </div>
          </form>
        </section>

        {/* Filter Tabs */}
        {replyNotice && (
          <div className="px-4 py-3 rounded-2xl border border-emerald-200 bg-emerald-50 text-xs font-bold text-emerald-800">
            {replyNotice}
          </div>
        )}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setFilterCat('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              filterCat === 'all'
                ? 'bg-zinc-950 text-white'
                : 'bg-white border border-zinc-200 text-zinc-600 hover:text-zinc-950'
            }`}
          >
            {locale === 'ko' ? '전체' : 'All'}
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setFilterCat(cat.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                filterCat === cat.id
                  ? 'bg-zinc-950 text-white'
                  : 'bg-white border border-zinc-200 text-zinc-600 hover:text-zinc-950'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Posts List */}
        <section className="space-y-4">
          {loadingPosts ? (
            <div className="bg-white rounded-3xl border border-zinc-200 p-8 text-center text-xs text-zinc-400">
              {locale === 'ko' ? '게시글을 불러오는 중...' : 'Loading posts...'}
            </div>
          ) : posts.length === 0 ? (
            <div className="bg-white rounded-3xl border border-zinc-200 p-10 text-center text-sm text-zinc-400">
              {locale === 'ko'
                ? '아직 등록된 글이 없습니다. 첫 번째 의견을 남겨보세요!'
                : 'No posts yet. Be the first to share!'}
            </div>
          ) : (
            posts.map((post) => {
              const meta = getCategoryMeta(post.category);
              const isAuthor =
                Boolean(email) && email.toLowerCase() === post.author_email.toLowerCase();
              return (
                <article
                  key={post.id}
                  className="bg-white rounded-3xl border border-zinc-200/90 p-5 sm:p-6 shadow-2xs space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2.5 py-0.5 rounded-full border text-[11px] font-bold ${meta.badgeClass}`}
                      >
                        {meta.label}
                      </span>
                      <span className="text-xs font-semibold text-zinc-500">
                        {maskEmail(post.author_email)}
                      </span>
                      {post.is_active === false && (
                        <span className="px-2 py-0.5 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-[10px] font-bold">
                          {locale === 'ko' ? '비활성화됨' : 'Disabled'}
                        </span>
                      )}
                      {post.admin_reply && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold">
                          {locale === 'ko' ? '답변완료' : 'Replied'}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      {isAdmin && (
                        <div className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-[11px] font-bold">
                          <label className="inline-flex items-center gap-1 cursor-pointer text-emerald-700">
                            <input
                              type="radio"
                              name={`board-post-active-${post.id}`}
                              checked={post.is_active !== false}
                              onChange={() => handleTogglePostActive(post.id, true)}
                              className="accent-emerald-600 cursor-pointer"
                            />
                            {locale === 'ko' ? '활성화' : 'Active'}
                          </label>
                          <label className="inline-flex items-center gap-1 cursor-pointer text-rose-600">
                            <input
                              type="radio"
                              name={`board-post-active-${post.id}`}
                              checked={post.is_active === false}
                              onChange={() => handleTogglePostActive(post.id, false)}
                              className="accent-rose-600 cursor-pointer"
                            />
                            {locale === 'ko' ? '비활성화' : 'Disabled'}
                          </label>
                        </div>
                      )}
                      <span className="text-[11px] text-zinc-400">
                        {new Date(post.created_at).toLocaleString(
                          locale === 'ko' ? 'ko-KR' : 'en-US'
                        )}
                      </span>
                      {isAdmin && !post.admin_reply && (
                        <button
                          type="button"
                          onClick={() => {
                            if (replyTargetId === post.id) {
                              setReplyTargetId(null);
                              setReplyDraft('');
                            } else {
                              setReplyTargetId(post.id);
                              setReplyDraft('');
                              setReplyNotice('');
                            }
                          }}
                          className="text-[11px] font-bold text-emerald-700 hover:underline cursor-pointer"
                        >
                          {locale === 'ko' ? '답변 작성' : 'Reply'}
                        </button>
                      )}
                      {(isAuthor || isAdmin) && !post.admin_reply && (
                        <button
                          type="button"
                          onClick={() => handleDelete(post.id)}
                          className="text-[11px] font-bold text-rose-600 hover:underline cursor-pointer"
                        >
                          {locale === 'ko' ? '삭제' : 'Delete'}
                        </button>
                      )}
                    </div>
                  </div>

                  <h2 className="text-base sm:text-lg font-extrabold text-zinc-950">
                    {post.title}
                  </h2>

                  <p className="text-sm text-zinc-600 whitespace-pre-wrap leading-relaxed">
                    {post.content}
                  </p>

                  {post.image_data && (
                    <div className="pt-2">
                      <img
                        src={post.image_data}
                        alt={post.title}
                        className="max-h-96 rounded-2xl border border-zinc-200 object-contain bg-zinc-50"
                      />
                    </div>
                  )}

                  {post.admin_reply && (
                    <div className="mt-3 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-extrabold text-emerald-800">
                          {locale === 'ko' ? '관리자 답변' : 'Admin Reply'}
                        </span>
                        {post.admin_replied_at && (
                          <span className="text-[11px] text-emerald-600">
                            {new Date(post.admin_replied_at).toLocaleString(
                              locale === 'ko' ? 'ko-KR' : 'en-US'
                            )}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-emerald-950 whitespace-pre-wrap leading-relaxed">
                        {post.admin_reply}
                      </p>
                    </div>
                  )}

                  {isAdmin && !post.admin_reply && replyTargetId === post.id && (
                    <div className="mt-3 rounded-2xl border border-zinc-200 bg-zinc-50 p-4 space-y-3">
                      <div className="text-xs font-bold text-zinc-700">
                        {locale === 'ko'
                          ? `관리자 답변 입력 (저장 시 작성자 ${post.author_email} 에게 자동 메일 발송)`
                          : `Admin Reply (auto-emailed to ${post.author_email})`}
                      </div>
                      <textarea
                        rows={3}
                        value={replyDraft}
                        onChange={(e) => setReplyDraft(e.target.value)}
                        placeholder={
                          locale === 'ko'
                            ? '답변 내용을 입력하세요 (비워두고 저장하면 답변이 삭제됩니다).'
                            : 'Write your reply...'
                        }
                        className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
                      />
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={savingReply}
                          onClick={() => handleSaveReply(post.id)}
                          className="px-4 py-2 rounded-xl bg-zinc-950 text-white text-xs font-bold hover:bg-emerald-600 transition cursor-pointer disabled:opacity-50"
                        >
                          {savingReply
                            ? locale === 'ko'
                              ? '저장 및 메일 발송 중...'
                              : 'Saving...'
                            : locale === 'ko'
                              ? '답변 저장 · 메일 발송'
                              : 'Save & Email Reply'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setReplyTargetId(null);
                            setReplyDraft('');
                          }}
                          className="px-4 py-2 rounded-xl border border-zinc-200 bg-white text-xs font-bold text-zinc-600 hover:bg-zinc-100 transition cursor-pointer"
                        >
                          {locale === 'ko' ? '취소' : 'Cancel'}
                        </button>
                      </div>
                    </div>
                  )}
                </article>
              );
            })
          )}
        </section>
      </main>
    </div>
  );
}
