import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/adminAuth';
import {
  BoardCategory,
  createBoardPost,
  deleteBoardPost,
  listBoardPosts,
  replyToBoardPost,
  setBoardPostActive,
} from '@/lib/boardStore';
import { sendBoardReplyNotificationEmail } from '@/lib/emailSender';
import { getUserSessionEmail } from '@/lib/userAuth';

const VALID_CATEGORIES = new Set<BoardCategory>(['feature', 'interior', 'contract']);

export async function GET(req: NextRequest) {
  try {
    const category = req.nextUrl.searchParams.get('category') || 'all';
    const isAdmin = isAdminAuthenticated(req);
    const includeInactive = isAdmin && req.nextUrl.searchParams.get('includeInactive') === '1';
    const data = await listBoardPosts(category, includeInactive);
    return NextResponse.json({
      ok: true,
      isAdmin,
      ...data,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to load posts';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const email = getUserSessionEmail(req);
  if (!email) {
    return NextResponse.json(
      { error: '로그인이 필요합니다. 상단에서 로그인 후 작성해 주세요.' },
      { status: 401 }
    );
  }

  try {
    const { category, title, content, imageData } = await req.json();

    if (!VALID_CATEGORIES.has(category)) {
      return NextResponse.json({ error: '카테고리를 선택해 주세요.' }, { status: 400 });
    }
    if (!title || typeof title !== 'string' || title.trim().length < 2) {
      return NextResponse.json({ error: '제목을 2자 이상 입력해 주세요.' }, { status: 400 });
    }
    if (!content || typeof content !== 'string' || content.trim().length < 2) {
      return NextResponse.json({ error: '내용을 2자 이상 입력해 주세요.' }, { status: 400 });
    }

    let safeImage: string | null = null;
    if (imageData && typeof imageData === 'string') {
      if (!imageData.startsWith('data:image/')) {
        return NextResponse.json({ error: '올바른 이미지 형식이 아닙니다.' }, { status: 400 });
      }
      if (imageData.length > 3_500_000) {
        return NextResponse.json(
          { error: '첨부 이미지가 너무 큽니다. 2.5MB 이하로 올려주세요.' },
          { status: 400 }
        );
      }
      safeImage = imageData;
    }

    const post = await createBoardPost({
      author_email: email,
      category,
      title,
      content,
      image_data: safeImage,
    });

    return NextResponse.json({ ok: true, post }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to create post';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  if (!isAdminAuthenticated(req)) {
    return NextResponse.json(
      { error: '관리자 로그인(/admin) 후 답변을 작성할 수 있습니다.' },
      { status: 401 }
    );
  }

  try {
    const { id, reply } = await req.json();
    if (!id || typeof id !== 'string') {
      return NextResponse.json({ error: 'Post id is required.' }, { status: 400 });
    }
    if (typeof reply !== 'string') {
      return NextResponse.json({ error: 'Reply text is required.' }, { status: 400 });
    }
    const post = await replyToBoardPost(id, reply);

    let emailNotification: { sent: boolean; error?: string } | null = null;
    if (post.admin_reply && post.author_email) {
      const baseUrl = (
        process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
        req.nextUrl.origin.replace('0.0.0.0', 'localhost')
      ).replace(/\/+$/, '');
      emailNotification = await sendBoardReplyNotificationEmail({
        toEmail: post.author_email,
        postTitle: post.title,
        replyText: post.admin_reply,
        boardUrl: `${baseUrl}/board`,
      });
    }

    return NextResponse.json({ ok: true, post, emailNotification });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to save reply';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function PUT(req: NextRequest) {
  if (!isAdminAuthenticated(req)) {
    return NextResponse.json(
      { error: '관리자 로그인(/admin) 후 게시글 상태를 변경할 수 있습니다.' },
      { status: 401 }
    );
  }

  try {
    const { id, isActive } = await req.json();
    if (!id || typeof id !== 'string') {
      return NextResponse.json({ error: 'Post id is required.' }, { status: 400 });
    }
    const post = await setBoardPostActive(id, Boolean(isActive));
    return NextResponse.json({ ok: true, post });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update post status';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest) {
  const email = getUserSessionEmail(req);
  const isAdmin = isAdminAuthenticated(req);
  if (!email && !isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await req.json();
    if (!id || typeof id !== 'string') {
      return NextResponse.json({ error: 'Post id is required.' }, { status: 400 });
    }
    await deleteBoardPost(id, email, isAdmin);
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to delete post';
    const status = message === 'Forbidden' ? 403 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
