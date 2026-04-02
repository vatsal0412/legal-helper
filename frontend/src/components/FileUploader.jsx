import { useRef } from 'react';

export function FileUploader({ onUpload, loading }) {
	const inputRef = useRef(null);

	return (
		<div className="card rounded-lg p-5">
			<h3 className="text-heading text-foreground mb-2 font-bold">
				📄 Document Ingestion
			</h3>
			<p className="text-body text-foreground-secondary mb-4">
				Upload PDF or DOCX files for citation-backed legal analysis.
			</p>
			<input
				ref={inputRef}
				type="file"
				accept=".pdf,.docx"
				className="hidden"
				onChange={e => onUpload(e.target.files?.[0])}
			/>
			<button
				className="btn-primary px-4 py-2.5 font-bold tracking-legal disabled:opacity-50"
				onClick={() => inputRef.current?.click()}
				disabled={loading}
				title="Upload legal documents"
			>
				{loading ?
					<span className="upload-indicator">
						<div className="w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
						Uploading
					</span>
				:	<span className="font-semibold">Upload File</span>}
			</button>
		</div>
	);
}
