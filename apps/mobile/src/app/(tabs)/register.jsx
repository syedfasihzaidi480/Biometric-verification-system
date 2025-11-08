import React, { Suspense } from 'react';

// Lazy-load the heavy register screen to avoid eager imports interfering with route discovery
const RegisterScreen = React.lazy(() => import('./register/index.jsx'));

export default function RegisterRoute() {
	return (
		<Suspense fallback={null}>
			<RegisterScreen />
		</Suspense>
	);
}