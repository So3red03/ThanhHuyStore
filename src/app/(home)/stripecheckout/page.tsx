import { Suspense } from 'react';
import Container from '../../components/Container';
import FormWarp from '../../components/FormWrap';
import StripeCheckout from './StripeCheckoutClient';

export const dynamic = 'force-dynamic';

const Checkout = () => {
  return (
    <div className='p-8'>
      <Container>
        <Suspense
          fallback={
            <div className='flex items-center justify-center h-64'>
              <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600'></div>
            </div>
          }
        >
          <FormWarp>
            <StripeCheckout />
          </FormWarp>
        </Suspense>
      </Container>
    </div>
  );
};

export default Checkout;
