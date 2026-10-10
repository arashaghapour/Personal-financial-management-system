import { Link } from 'react-router-dom'
import { PageContainer } from '../components/ui/PageContainer'

export default function NotFoundPage() {
  return (
    <PageContainer>
      <h1>Page not found</h1>
      <p className="page-description">
        The page you are looking for does not exist or has been moved.
      </p>
      <Link to="/dashboard">Return to dashboard</Link>
    </PageContainer>
  )
}
