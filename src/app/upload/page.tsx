'use client';

import { useSession } from 'next-auth/react';
import { useMutation } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function UploadPage() {
	const { data: session, status } = useSession();
	const [file, setFile] = useState<File | null>(null);
	const router = useRouter();

	const token = session?.accessToken;
	const userId = session?.user?.id || 'fallback-id';

	const initiateUpload = async (file: File) => {
		const res = await fetch(`${process.env.API_URL}/video/initiate-upload`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${token}`,
			},
			body: JSON.stringify({
				userId,
				fileName: file.name,
			}),
		});

		if (!res.ok) throw new Error('Failed to get upload URL');
		return res.json();
	};

	const uploadToPresignedUrl = async (uploadUrl: string, file: File) => {
		const res = await fetch(uploadUrl, {
			method: 'PUT',
			body: file,
		});
		if (!res.ok) throw new Error('Upload failed');
	};

	const initAndUploadMutation = useMutation({
		mutationFn: async () => {
			if (!file) throw new Error('No file selected');
			const { uploadUrl, videoId } = await initiateUpload(file);
			await uploadToPresignedUrl(uploadUrl, file);
			await confirmUploadMutation.mutateAsync(videoId);
		},
		onSuccess: () => alert('Upload complete!'),
		onError: (err) => alert((err as Error).message),
	});

	const confirmUploadMutation = useMutation({
		mutationFn: async (videoId: string) => {
			const res = await fetch(`${process.env.API_URL}/video/confirm-upload`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify({ videoId }),
			});
			if (!res.ok) throw new Error('Upload confirmation failed');
		},
	});

	if (status === 'loading') return <p>Loading...</p>;

	return (
		<main className='p-6 max-w-md mx-auto'>
			<h1 className='text-xl font-bold mb-4'>Upload a Video</h1>
			<input
				type='file'
				accept='video/*'
				onChange={(e) => setFile(e.target.files?.[0] || null)}
				className='block w-full border p-2 mb-4'
			/>
			<button
				disabled={!file || initAndUploadMutation.isPending}
				onClick={() => initAndUploadMutation.mutate()}
				className='bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50'
			>
				{initAndUploadMutation.isPending ? 'Uploading...' : 'Upload'}
			</button>
		</main>
	);
}
