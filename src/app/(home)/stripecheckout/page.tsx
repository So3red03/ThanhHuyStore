import { Suspense } from 'react';
import Container from '../../components/Container';
import FormWarp from '../../components/FormWrap';
import StripeCheckout from './StripeCheckoutClient';

export const dynamic = 'force-dynamic';

const Checkout = () => {
	return (
		<div className="p-8">
			<Container>
				<Suspense fallback={<div>Loading...</div>}>
					<FormWarp>
						<StripeCheckout />
					</FormWarp>
				</Suspense>
			</Container>
		</div>
	);
};

export default Checkout;
