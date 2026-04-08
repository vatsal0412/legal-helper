import { FileText, Upload } from 'lucide-react';
import { useRef } from 'react';

export function FileUploader({ onUpload, loading }) {
	const inputRef = useRef(null);

	return (
		<div className="card rounded-lg p-5">
			<h3 className="text-heading text-foreground mb-2 font-bold">
				<span className="inline-flex items-center gap-2">
					<FileText className="h-5 w-5" />
					Document Ingestion
				</span>
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
						<Upload className="h-4 w-4 animate-bounce" />
						Uploading
					</span>
				:	<span className="font-semibold">Upload File</span>}
			</button>
		</div>
	);
}
