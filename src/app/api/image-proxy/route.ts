import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '../auth/[...nextauth]/route';

export async function GET(req: NextRequest) {
	const session = await getServerSession(authOptions);

	if (!session) {
		return NextResponse.redirect(new URL('/api/auth/signin', req.url));
	}

	const key = req.nextUrl.searchParams.get('key');
	if (!key) return new NextResponse('Missing key', { status: 400 });

	const res = await fetch(
		`${process.env.NEXT_PUBLIC_API_URL}/video/preview-url?key=${key}`,
		{
			headers: {
				Authorization: `Bearer ${session.accessToken}`,
			},
			cache: 'no-store',
		}
	);

	if (!res.ok) {
		return new NextResponse('Failed to fetch preview URL', {
			status: res.status,
		});
	}

	const { url } = await res.json();
	return NextResponse.redirect(url);
}
