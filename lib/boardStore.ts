import crypto from 'crypto';
import { getSupabaseAdmin, isMissingTableError } from '@/lib/creditGate';

export type BoardCategory = 'feature' | 'interior' | 'contract';

export interface BoardPost {
  id: string;
  author_email: string;
  category: BoardCategory;
  title: string;
  content: string;
  image_data?: string | null;
  is_active: boolean;
  admin_reply?: string | null;
  admin_replied_at?: string | null;
  created_at: string;
}

const globalForBoard = globalThis as unknown as {
  __hookaiBoardPosts?: BoardPost[];
};

function getMemoryPosts(): BoardPost[] {
  if (!globalForBoard.__hookaiBoardPosts) {
    globalForBoard.__hookaiBoardPosts = [];
  }
  return globalForBoard.__hookaiBoardPosts;
}

export async function listBoardPosts(
  category?: string,
  includeInactive = false
): Promise<{
  source: 'supabase' | 'memory';
  posts: BoardPost[];
}> {
  const supabase = getSupabaseAdmin();
  const validCat =
    category === 'feature' || category === 'interior' || category === 'contract'
      ? category
      : null;

  if (!supabase) {
    const posts = getMemoryPosts()
      .filter((p) => (!validCat || p.category === validCat) && (includeInactive || p.is_active !== false))
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
    return { source: 'memory', posts };
  }

  let query = supabase
    .from('board_posts')
    .select(
      'id, author_email, category, title, content, image_data, is_active, admin_reply, admin_replied_at, created_at'
    )
    .order('created_at', { ascending: false })
    .limit(100);

  if (validCat) {
    query = query.eq('category', validCat);
  }
  if (!includeInactive) {
    query = query.eq('is_active', true);
  }

  const { data, error } = await query;
  if (error) {
    if (isMissingTableError(error.message)) {
      const posts = getMemoryPosts()
        .filter((p) => (!validCat || p.category === validCat) && (includeInactive || p.is_active !== false))
        .sort((a, b) => b.created_at.localeCompare(a.created_at));
      return { source: 'memory', posts };
    }
    throw new Error(error.message);
  }

  return { source: 'supabase', posts: (data || []) as BoardPost[] };
}

export async function createBoardPost(input: {
  author_email: string;
  category: BoardCategory;
  title: string;
  content: string;
  image_data?: string | null;
}): Promise<BoardPost> {
  const post: BoardPost = {
    id: crypto.randomUUID(),
    author_email: input.author_email.toLowerCase().trim(),
    category: input.category,
    title: input.title.trim(),
    content: input.content.trim(),
    image_data: input.image_data || null,
    is_active: true,
    created_at: new Date().toISOString(),
  };

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    getMemoryPosts().unshift(post);
    return post;
  }

  const { data, error } = await supabase
    .from('board_posts')
    .insert({
      author_email: post.author_email,
      category: post.category,
      title: post.title,
      content: post.content,
      image_data: post.image_data,
      is_active: true,
    })
    .select('id, author_email, category, title, content, image_data, is_active, created_at')
    .single();

  if (error) {
    if (isMissingTableError(error.message)) {
      getMemoryPosts().unshift(post);
      return post;
    }
    throw new Error(error.message);
  }

  return data as BoardPost;
}

export async function deleteBoardPost(
  id: string,
  requesterEmail: string | null,
  isAdmin: boolean
): Promise<void> {
  const supabase = getSupabaseAdmin();
  const cleanEmail = requesterEmail?.toLowerCase().trim() || '';

  const deleteFromMemory = () => {
    const posts = getMemoryPosts();
    const idx = posts.findIndex((p) => p.id === id);
    if (idx === -1) throw new Error('Post not found.');
    if (posts[idx].admin_reply) {
      throw new Error('답변이 달린 게시글은 삭제할 수 없습니다.');
    }
    if (!isAdmin && posts[idx].author_email !== cleanEmail) {
      throw new Error('Forbidden');
    }
    posts.splice(idx, 1);
  };

  if (!supabase) {
    deleteFromMemory();
    return;
  }

  const { data: existing, error: fetchErr } = await supabase
    .from('board_posts')
    .select('id, author_email, admin_reply')
    .eq('id', id)
    .maybeSingle();

  if (fetchErr) {
    if (isMissingTableError(fetchErr.message)) {
      deleteFromMemory();
      return;
    }
    throw new Error(fetchErr.message);
  }

  if (!existing) throw new Error('Post not found.');
  if (existing.admin_reply) {
    throw new Error('답변이 달린 게시글은 삭제할 수 없습니다.');
  }
  if (!isAdmin && existing.author_email !== cleanEmail) {
    throw new Error('Forbidden');
  }

  const { error: delErr } = await supabase.from('board_posts').delete().eq('id', id);
  if (delErr) throw new Error(delErr.message);
}

export async function replyToBoardPost(id: string, replyText: string): Promise<BoardPost> {
  const cleanReply = replyText.trim();
  const now = new Date().toISOString();
  const supabase = getSupabaseAdmin();

  const replyInMemory = () => {
    const posts = getMemoryPosts();
    const post = posts.find((p) => p.id === id);
    if (!post) throw new Error('Post not found.');
    if (post.admin_reply) {
      throw new Error('이미 답변이 등록된 게시글은 수정할 수 없습니다.');
    }
    post.admin_reply = cleanReply || null;
    post.admin_replied_at = cleanReply ? now : null;
    return post;
  };

  if (!supabase) {
    return replyInMemory();
  }

  const { data: existing, error: fetchErr } = await supabase
    .from('board_posts')
    .select('id, admin_reply')
    .eq('id', id)
    .maybeSingle();

  if (fetchErr) {
    if (isMissingTableError(fetchErr.message)) {
      return replyInMemory();
    }
    throw new Error(fetchErr.message);
  }

  if (!existing) throw new Error('Post not found.');
  if (existing.admin_reply) {
    throw new Error('이미 답변이 등록된 게시글은 수정할 수 없습니다.');
  }

  const { data, error } = await supabase
    .from('board_posts')
    .update({
      admin_reply: cleanReply || null,
      admin_replied_at: cleanReply ? now : null,
    })
    .eq('id', id)
    .select('id, author_email, category, title, content, image_data, is_active, admin_reply, admin_replied_at, created_at')
    .single();

  if (error) {
    if (isMissingTableError(error.message)) {
      return replyInMemory();
    }
    throw new Error(error.message);
  }

  return data as BoardPost;
}

export async function setBoardPostActive(id: string, isActive: boolean): Promise<BoardPost> {
  const next = Boolean(isActive);
  const supabase = getSupabaseAdmin();

  const updateInMemory = () => {
    const post = getMemoryPosts().find((p) => p.id === id);
    if (!post) throw new Error('Post not found.');
    post.is_active = next;
    return post;
  };

  if (!supabase) {
    return updateInMemory();
  }

  const { data, error } = await supabase
    .from('board_posts')
    .update({ is_active: next })
    .eq('id', id)
    .select('id, author_email, category, title, content, image_data, is_active, admin_reply, admin_replied_at, created_at')
    .single();

  if (error) {
    if (isMissingTableError(error.message)) {
      return updateInMemory();
    }
    throw new Error(error.message);
  }

  return data as BoardPost;
}
