import SignUp from '@/components/auth/SignUp';
import Tarifs from '@/components/home/Tarifs';
import TittlePanel from '@/components/home/TittlePanel';
import Layout from '@/components/Layout';
import { getRegistrationHtml } from '@/lib/mailer/registration';
import { NextPage } from 'next';
import { signOut } from 'next-auth/react';
import styles from '@/styles/home/Index.module.scss'
import Image from 'next/image';
import background from '@/assets/home/Lab Studio 1600.png'
import About from '@/components/home/About';
import Comments from '@/components/home/Comments';
import FAQ from '@/components/home/FAQ';

const Index: NextPage = () => {

	return (
		<Layout>
			<div className={styles.index}>
				<TittlePanel />
				<About />
				<Tarifs />
				<Comments />
				<FAQ />
			</div>
		</Layout>
	)
}

export default Index
