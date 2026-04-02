import { Link } from 'react-router-dom';

export function LandingPage() {
	return (
		<main className="min-h-screen grid place-items-center px-4 bg-surface">
			<section className="card max-w-4xl w-full rounded-lg p-12 fade-up">
				<p className="text-xs font-bold uppercase tracking-legal text-accent">
					AI + Legal Workflow
				</p>
				<h1 className="text-display-lg text-foreground mt-4 leading-tight font-bold">
					Your Digital Legal Manuscript
				</h1>
				<p className="mt-6 text-foreground-secondary max-w-2xl leading-relaxed text-body-lg">
					Production-grade legal assistant with secure authentication,
					citation-backed document retrieval, and end-to-end ingestion
					tracking. Designed for serious legal research and analysis.
				</p>
				<div className="mt-8 flex gap-3 flex-wrap">
					<Link
						to="/signup"
						className="btn-primary px-6 py-3 font-bold tracking-legal"
					>
						Create account
					</Link>
					<Link
						to="/login"
						className="btn-secondary px-6 py-3 font-bold tracking-legal"
					>
						Sign in
					</Link>
				</div>
				<p className="text-caption text-foreground-muted mt-8 pt-6 border-t border-surface-tertiary">
					✓ Secure • ✓ Private • ✓ Research-Grade
				</p>
			</section>
		</main>
	);
}
