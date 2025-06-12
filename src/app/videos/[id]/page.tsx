// app/videos/[id]/page.tsx
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import VideoPlayer from '@/components/VideoPlayer';
import { getServerSession } from 'next-auth';

import { notFound } from 'next/navigation';

type Props = {
	params: {
		id: string;
	};
};

export default async function VideoPlaybackPage({ params }: Props) {
	const { id: videoId } = await params;
	const session = await getServerSession(authOptions);

	if (!session || !session.accessToken) {
		return notFound();
	}

	const res = await fetch(
		`${process.env.NEXT_PUBLIC_API_URL}/video/${videoId}/play`,
		{
			headers: {
				Authorization: `Bearer ${session.accessToken}`,
			},
			cache: 'no-store',
		}
	);

	if (!res.ok) return notFound();

	const video = await res.json();

	const sources = [
		{
			src: video.video1080pUrl,
			label: '1080p',
			type: 'video/mp4',
		},
		{
			src: video.video720pUrl,
			label: '720p',
			type: 'video/mp4',
		},
		{
			src: video.video480pUrl,
			label: '480p',
			type: 'video/mp4',
		},
		{
			src: video.video144pUrl,
			label: '144p',
			type: 'video/mp4',
		},
	];

	return (
		<div className='max-w-4xl mx-auto p-6'>
			<h1 className='text-2xl font-bold mb-4'>🎬 Video Playback</h1>
			<VideoPlayer poster={video.thumbnailUrl} sources={sources} />
		</div>
	);
}
