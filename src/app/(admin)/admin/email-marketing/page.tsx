import { Metadata } from 'next';
import EmailMarketingClient from './EmailMarketingClient';

export const metadata: Metadata = {
  title: 'Email Marketing - ThanhHuy Store Admin',
  description: 'Quản lý chiến dịch email marketing'
};

const EmailMarketingPage = () => {
  return <EmailMarketingClient />;
};

export default EmailMarketingPage;
