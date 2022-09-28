import SignUp from '@/components/auth/SignUp';
import Layout from '@/components/Layout';
import { getRegistrationHtml } from '@/lib/mailer/registration';
import { NextPage } from 'next';
import { signOut } from 'next-auth/react';

const Index: NextPage = () => {

	return (
		<Layout>
		</Layout>
	)
}

export default Index
