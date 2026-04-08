import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
	ArrowLeft,
	Check,
	CircleUserRound,
	ImagePlus,
	Link2,
	Trash2,
	Upload,
} from 'lucide-react';
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
	const fileInputRef = useRef(null);
	const [name, setName] = useState(user?.name || '');
	const [avatar, setAvatar] = useState(user?.avatar || '');
	const [avatarMode, setAvatarMode] = useState(
		user?.avatar ? 'url' : 'upload',
	);

	useEffect(() => {
		setName(user?.name || '');
		setAvatar(user?.avatar || '');
	}, [user]);

	const handleAvatarFile = file => {
		if (!file) return;
		const reader = new FileReader();
		reader.onload = () => {
			if (typeof reader.result === 'string') {
				setAvatar(reader.result);
				setAvatarMode('upload');
			}
		};
		reader.readAsDataURL(file);
	};

	const save = async e => {
		e.preventDefault();
		await dispatch(updateProfile({ name, avatar }));
	};

	const remove = async () => {
		await dispatch(deleteAccount());
		navigate('/signup');
	};

	return (
		<main className="w-4/5 mx-auto p-4 bg-none min-h-screen">
			<button
				type="button"
				onClick={() => navigate('/dashboard')}
				className="mb-6 btn-ghost text-foreground hover:text-accent transition-colors inline-flex items-center gap-2"
				title="Back to dashboard"
			>
				<ArrowLeft className="h-5 w-5" />
				<span>Back</span>
			</button>
			<div className="flex justify-evenly">
				<aside className="rounded-lg p-6 space-y-5">
					<div>
						<h1 className="text-display text-foreground font-bold mb-1">
							<span className="inline-flex items-center gap-2">
								<CircleUserRound className="h-6 w-6" />
								Profile
							</span>
						</h1>
						<p className="text-caption text-foreground-muted">
							Email:{' '}
							<span className="text-accent font-mono">
								{user?.email}
							</span>
						</p>
					</div>
					<div className="flex flex-col items-center text-center gap-4 pt-2">
						<div className="w-32 h-32 rounded-full border border-surface-tertiary bg-surface-secondary overflow-hidden flex items-center justify-center shadow-md">
							{avatar ?
								<img
									src={avatar}
									alt="Profile avatar preview"
									className="w-full h-full object-cover"
								/>
							:	<CircleUserRound className="h-14 w-14 text-accent" />
							}
						</div>
						<div className="space-y-1">
							<p className="text-caption text-foreground-muted">
								Avatar source
							</p>
						</div>
						<input
							ref={fileInputRef}
							type="file"
							accept="image/*"
							className="hidden"
							onChange={e =>
								handleAvatarFile(e.target.files?.[0])
							}
						/>
						{avatar && (
							<p className="text-caption text-foreground-muted break-all">
								<ImagePlus className="inline h-3.5 w-3.5 mr-1 align-[-2px]" />
								Updated avatar is ready to save.
							</p>
						)}
					</div>
				</aside>

				<section className="card rounded-lg p-6 space-y-5">
					<form onSubmit={save} className="space-y-5">
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
							<div className="card rounded-lg p-4 bg-surface-secondary">
								<p className="text-caption text-foreground-muted mb-3">
									Upload avatar.
								</p>
								<div className="flex items-center gap-3">
									<button
										type="button"
										className="btn-secondary px-4 py-2.5 text-sm"
										onClick={() =>
											fileInputRef.current?.click()
										}
									>
										<span className="inline-flex items-center gap-2">
											<Upload className="h-4 w-4" />
											Choose image file
										</span>
									</button>
									<span className="text-caption text-foreground-muted">
										PNG, JPG, GIF, or WEBP
									</span>
								</div>
							</div>
						</div>
						<div className="flex flex-wrap gap-2 pt-4 border-t border-surface-tertiary">
							<button
								type="button"
								className="btn-secondary font-bold px-5 py-2.5"
								onClick={save}
							>
								<Check className="h-4 w-4" />
								Save Changes
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
								className="btn-primary font-bold px-5 py-2.5"
								onClick={remove}>
								<span className="inline-flex items-center gap-2">
									<Trash2 className="h-4 w-4" />
									Delete Account
								</span>
							</button>
						</div>
					</form>
				</section>
			</div>
		</main>
	);
}
