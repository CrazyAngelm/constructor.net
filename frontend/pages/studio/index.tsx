import type { NextPage } from 'next'

import StudioWorkspace from '@/components/studio/StudioWorkspace'
import { withSession } from '@/lib/session/withSession'

const StudioPage: NextPage = () => <StudioWorkspace />

export const getServerSideProps = withSession(() => ({ props: {} }))

export default StudioPage
