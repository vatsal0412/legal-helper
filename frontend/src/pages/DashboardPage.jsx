import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { FileText, LayoutDashboard, UserCircle2 } from 'lucide-react';

export function DashboardPage() {
	const user = useSelector(s => s.auth.user);

	return (
		<main className="p-6 max-w-6xl mx-auto bg-surface min-h-screen">
			<section className="card rounded-lg p-8 fade-up">
				<div className="mb-6">
					<h1 className="text-display text-foreground font-bold">
						Welcome, {user?.name || 'Counselor'}
					</h1>
					<p className="mt-2 text-foreground-secondary leading-relaxed">
						Use your legal workspace to manage documents and conduct
						research with citation-grounded AI conversations.
					</p>
				</div>
				<div className="grid sm:grid-cols-3 gap-4 mt-8">
					<Link
						to="/chat"
						className="card rounded-lg p-5 text-center hover:border-accent transition-all group"
					>
						<div className="flex items-center justify-center w-10 h-10 mx-auto mb-3 text-accent">
							<LayoutDashboard className="h-6 w-6" />
						</div>
						<h2 className="text-heading text-foreground font-bold group-hover:text-accent transition-colors">
							Chat Workspace
						</h2>
						<p className="text-caption text-foreground-muted mt-2">
							Research with context
						</p>
					</Link>
					<Link
						to="/documents"
						className="card rounded-lg p-5 text-center hover:border-accent transition-all group"
					>
						<div className="flex items-center justify-center w-10 h-10 mx-auto mb-3 text-accent">
							<FileText className="h-6 w-6" />
						</div>
						<h2 className="text-heading text-foreground font-bold group-hover:text-accent transition-colors">
							Documents
						</h2>
						<p className="text-caption text-foreground-muted mt-2">
							Manage legal files
						</p>
					</Link>
					<Link
						to="/profile"
						className="card rounded-lg p-5 text-center hover:border-accent transition-all group"
					>
						<div className="flex items-center justify-center w-10 h-10 mx-auto mb-3 text-accent">
							<UserCircle2 className="h-6 w-6" />
						</div>
						<h2 className="text-heading text-foreground font-bold group-hover:text-accent transition-colors">
							Profile
						</h2>
						<p className="text-caption text-foreground-muted mt-2">
							Settings & preferences
						</p>
					</Link>
				</div>
			</section>
		</main>
	);
}
