import Landing from '@/components/home/Landing'
import { NextPage } from 'next'
import Head from 'next/head'

const Index: NextPage = () => {

	return <>
		<Head>
			<title>Lab Studio — конструктор учебных материалов</title>
			<meta name="viewport" content="width=device-width, initial-scale=1" />
		</Head>
		<Landing />
	</>
}

export default Index
