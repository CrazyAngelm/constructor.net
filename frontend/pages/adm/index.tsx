import Layout from "@/components/Layout";
import { withAdminSession } from "@/lib/session/withSession";
import { NextPage } from "next";

const Adm: NextPage = () => {
	return (
		<Layout>
			adminka
		</Layout>
	)
}

export default Adm

export const getServerSideProps = withAdminSession(session => {
	console.log(session)
	return {
		props: {}
	}
})
