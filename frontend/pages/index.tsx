import SignUp from '@/components/auth/SignUp';
import Tarifs from '@/components/home/Tarifs';
import TittlePanel from '@/components/home/TittlePanel';
import Layout from '@/components/Layout';
import { getRegistrationHtml } from '@/lib/mailer/registration';
import { NextPage } from 'next';
import { signOut } from 'next-auth/react';

const Index: NextPage = () => {

	return (
		<Layout>
			<TittlePanel />
			<Tarifs />
		</Layout>
	)
}

export default Index
