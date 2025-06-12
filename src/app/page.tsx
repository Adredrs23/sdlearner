import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from './api/auth/[...nextauth]/route';
import { ImagePreviewer } from '@/components/ImagePreviewer';
import Link from 'next/link';

type Video = {
	id: string;
	fileName: string;
	thumbnailUrl: string;
	status: string;
};

export default async function VideosDashboard() {
	const session = await getServerSession(authOptions);

	if (!session) {
		redirect('/api/auth/signin'); // If not logged in, redirect to login
	}

	const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/video/user`, {
		headers: {
			Authorization: `Bearer ${session.accessToken}`,
		},
		cache: 'no-store',
	});

	const videos: Video[] = await res.json();

	return (
		<div className='p-6'>
			<div className='flex justify-between'>
				<h1 className='text-2xl font-bold mb-4'>Your Videos</h1>
				<Link href={'/upload'}>Upload</Link>
			</div>
			<div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4'>
				{videos.map((video) => (
					<a
						key={video.id}
						href={`/videos/${video.id}`}
						className='border rounded-lg overflow-hidden hover:shadow-lg transition'
					>
						<ImagePreviewer video={video} />
						<div className='p-3'>
							<p className='font-semibold'>{video.fileName}</p>
							<p className='text-sm text-gray-600 capitalize'>{video.status}</p>
						</div>
					</a>
				))}
			</div>
		</div>
	);
}
