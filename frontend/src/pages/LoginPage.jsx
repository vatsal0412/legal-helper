import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle, LoaderCircle } from 'lucide-react';
import { login } from '../features/auth/authSlice';

export function LoginPage() {
	const dispatch = useDispatch();
	const navigate = useNavigate();
	const { loading, error } = useSelector(s => s.auth);
	const [form, setForm] = useState({ email: '', password: '' });

	const onSubmit = async e => {
		e.preventDefault();
		const result = await dispatch(login(form));
		if (!result.error) navigate('/dashboard');
	};

	return (
		<main className="min-h-screen grid place-items-center px-4 bg-surface">
			<form
				onSubmit={onSubmit}
				className="card rounded-lg p-8 w-full max-w-md space-y-4 border-surface-tertiary"
			>
				<div className="mb-6">
					<h1 className="text-display text-foreground font-bold">
						Welcome back
					</h1>
					<p className="text-caption text-foreground-muted mt-2">
						Sign in to your legal assistant
					</p>
				</div>
				<input
					className="input-field"
					placeholder="Email address"
					type="email"
					value={form.email}
					onChange={e => setForm({ ...form, email: e.target.value })}
					required
				/>
				<input
					className="input-field"
					placeholder="Password"
					type="password"
					value={form.password}
					onChange={e =>
						setForm({ ...form, password: e.target.value })
					}
					required
				/>
				{error && (
					<div className="error-indicator w-full justify-start">
						<AlertCircle className="h-4 w-4" />
						<span>{error}</span>
					</div>
				)}
				<button
					className="btn-primary w-full font-bold tracking-legal"
					disabled={loading}
				>
					{loading ?
						<LoaderCircle className="h-4 w-4 animate-spin" />
					:	'Login'}
				</button>
				<p className="text-sm text-foreground-secondary text-center">
					New user?{' '}
					<Link
						className="text-accent font-bold hover:text-accent-light transition-colors"
						to="/signup"
					>
						Create account
					</Link>
				</p>
			</form>
		</main>
	);
}
