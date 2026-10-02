export default function AuthRedirect() { return null }
export const getServerSideProps = () => ({ redirect: { destination: '/studio/auth', permanent: false } })
