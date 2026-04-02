import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { signup } from '../features/auth/authSlice';

export function SignupPage() {
	const dispatch = useDispatch();
	const navigate = useNavigate();
	const { loading, error } = useSelector(s => s.auth);
	const [form, setForm] = useState({ name: '', email: '', password: '' });

	const onSubmit = async e => {
		e.preventDefault();
		const result = await dispatch(signup(form));
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
						Create account
					</h1>
					<p className="text-caption text-foreground-muted mt-2">
						Join for legal research and analysis
					</p>
				</div>
				<input
					className="input-field"
					placeholder="Full name"
					value={form.name}
					onChange={e => setForm({ ...form, name: e.target.value })}
					required
				/>
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
					<p className="text-error text-sm bg-error/10 rounded-lg p-2 text-center">
						⚠ {error}
					</p>
				)}
				<button
					className="btn-primary w-full font-bold tracking-legal"
					disabled={loading}
				>
					{loading ? '⏳ Creating...' : 'Create account'}
				</button>
				<p className="text-sm text-foreground-secondary text-center">
					Already have an account?{' '}
					<Link
						className="text-accent font-bold hover:text-accent-light transition-colors"
						to="/login"
					>
						Sign in
					</Link>
				</p>
			</form>
		</main>
	);
}
