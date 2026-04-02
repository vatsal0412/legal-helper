import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { FileUploader } from '../components/FileUploader';
import {
	fetchDocuments,
	retryDocument,
	uploadDocument,
} from '../features/documents/documentSlice';

export function DocumentsPage() {
	const dispatch = useDispatch();
	const { items, loading, uploadState } = useSelector(s => s.documents);

	useEffect(() => {
		dispatch(fetchDocuments());
	}, [dispatch]);

	const handleUpload = async file => {
		if (!file) return;
		await dispatch(uploadDocument(file));
		dispatch(fetchDocuments());
	};

	return (
		<main className="max-w-6xl mx-auto p-4 space-y-4 bg-surface min-h-screen">
			<FileUploader
				onUpload={handleUpload}
				loading={uploadState === 'uploading'}
			/>
			<section className="card rounded-lg p-5">
				<div className="flex items-center justify-between mb-4">
					<h2 className="text-heading-lg text-foreground font-bold">
						📑 Document Library
					</h2>
					<button
						className="btn-ghost text-accent font-bold text-sm tracking-legal"
						onClick={() => dispatch(fetchDocuments())}
					>
						↻ REFRESH
					</button>
				</div>
				{loading ?
					<p className="text-foreground-muted">
						Loading documents...
					</p>
				: items.length === 0 ?
					<p className="text-foreground-muted">
						No documents uploaded yet
					</p>
				:	null}
				<div className="space-y-2">
					{items.map(doc => (
						<div
							key={doc._id}
							className="card rounded-lg p-4 flex items-center justify-between hover:border-accent transition-colors"
						>
							<div className="flex-1">
								<p className="font-semibold text-foreground">
									{doc.originalName}
								</p>
								<p className="text-xs text-foreground-muted mt-1">
									<span className="text-accent font-mono">
										{doc.status}
									</span>{' '}
									· retries: {doc.retryCount || 0}
								</p>
								{doc.lastError ?
									<p className="text-xs text-error mt-1">
										⚠ {doc.lastError}
									</p>
								:	null}
							</div>
							<button
								className="btn-secondary text-xs font-bold px-3 py-1.5"
								onClick={() => dispatch(retryDocument(doc._id))}
								disabled={doc.status === 'processing'}
								title="Retry document processing"
							>
								{doc.status === 'processing' ?
									'Processing...'
								:	'Retry'}
							</button>
						</div>
					))}
				</div>
			</section>
		</main>
	);
}
