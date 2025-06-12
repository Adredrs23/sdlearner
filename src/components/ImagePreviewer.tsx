'use client';

import Image from 'next/image';

const thumbnailLoader = ({ src }: { src: string }) => {
	return `/api/image-proxy?key=${encodeURIComponent(src)}`;
};

export const ImagePreviewer = ({ video }) => {
	if (!video.thumbnailUrl) return null;
	return (
		<Image
			loader={thumbnailLoader}
			src={video.thumbnailUrl}
			alt={video.fileName}
			width={320}
			height={192}
			className='w-full h-48 object-cover'
		/>
	);
};
