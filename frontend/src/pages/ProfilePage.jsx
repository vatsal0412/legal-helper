import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
	deleteAccount,
	logout,
	updateProfile,
} from '../features/auth/authSlice';
import { useNavigate } from 'react-router-dom';

export function ProfilePage() {
	const user = useSelector(s => s.auth.user);
	const dispatch = useDispatch();
	const navigate = useNavigate();
	const [name, setName] = useState(user?.name || '');
	const [avatar, setAvatar] = useState(user?.avatar || '');

	const save = async e => {
		e.preventDefault();
		await dispatch(updateProfile({ name, avatar }));
	};

	const remove = async () => {
		await dispatch(deleteAccount());
		navigate('/signup');
	};

	return (
		<main className="max-w-3xl mx-auto p-4 bg-surface min-h-screen">
			<form onSubmit={save} className="card rounded-lg p-6 space-y-5">
				<div>
					<h1 className="text-display text-foreground font-bold mb-1">
						👤 Profile
					</h1>
					<p className="text-caption text-foreground-muted">
						Email:{' '}
						<span className="text-accent font-mono">
							{user?.email}
						</span>
					</p>
				</div>
				<div className="space-y-4">
					<div>
						<label className="block text-body font-semibold text-foreground mb-2">
							Full Name
						</label>
						<input
							className="input-field"
							value={name}
							onChange={e => setName(e.target.value)}
							placeholder="Your name"
							required
						/>
					</div>
					<div>
						<label className="block text-body font-semibold text-foreground mb-2">
							Avatar URL
						</label>
						<input
							className="input-field"
							value={avatar}
							onChange={e => setAvatar(e.target.value)}
							placeholder="Profile image URL"
						/>
					</div>
				</div>
				<div className="flex gap-2 pt-4 border-t border-surface-tertiary">
					<button className="btn-primary font-bold px-5 py-2.5">
						✓ Save Changes
					</button>
					<button
						type="button"
						className="btn-secondary font-bold px-5 py-2.5"
						onClick={() => dispatch(logout())}
					>
						Logout
					</button>
					<button
						type="button"
						className="inline-flex items-center justify-center px-4 py-2.5 bg-error/80 hover:bg-error text-foreground font-bold text-sm rounded-lg shadow-md transition-all duration-200 ml-auto"
						onClick={remove}
					>
						🗑 Delete Account
					</button>
				</div>
			</form>
		</main>
	);
}
