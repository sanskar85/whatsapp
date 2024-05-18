import { useEffect, useRef } from 'react';

type Props = {
	base64Data: string;
	logoUrl: string;
};

const QRLogo = ({ base64Data, logoUrl }: Props) => {
	const canvasRef = useRef<HTMLCanvasElement | null>(null);

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		const ctx = canvas.getContext('2d');
		const loadImages = async () => {
			if (!ctx) return;
			const qrCodeImage = await loadImage(base64Data);
			const logoImage = await loadImage(logoUrl);

			ctx.drawImage(qrCodeImage as CanvasImageSource, 0, 0, canvas.width, canvas.height);

			const logoSize = canvas.width * 0.2; // Adjust the logo size as needed
			const xPos = (canvas.width - logoSize) / 2;
			const yPos = (canvas.height - logoSize) / 2;

			ctx.drawImage(logoImage as CanvasImageSource, xPos, yPos, logoSize, logoSize);
		};

		loadImages();
	}, [base64Data, logoUrl]);

	const loadImage = (src: string) => {
		return new Promise((resolve, reject) => {
			const image = new Image();
			image.onload = () => resolve(image);
			image.onerror = (err) => reject(err);
			image.src = src;
		});
	};

	return <canvas ref={(ref) => (canvasRef.current = ref)} height={'350px'} width={'350px'} />;
};

export default QRLogo;
