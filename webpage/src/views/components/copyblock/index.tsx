import { CopyBlock, dracula } from 'react-code-blocks';

export default function CodeBlocks({
	code,
	language,
	title,
}: {
	title: string;
	code: string;
	language: 'bash' | 'json' | 'javascript';
}) {
	return (
		<div>
			<p>{title}</p>
			<CopyBlock
				text={code}
				language={language}
				theme={dracula}
				codeBlock={true}
				copied={true}
				showLineNumbers={false}
			/>
		</div>
	);
}
