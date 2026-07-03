import { Layout } from './components/Layout'
import { Display } from './components/Display'

function App() {
	return (
		<Layout>
			<Display vmId="vm-1" vncPort={5900} />
		</Layout>
	)
}

export default App
