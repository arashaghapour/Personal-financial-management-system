import { Link } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { PageContainer } from '../components/ui/PageContainer'

export default function LoginPage() {
  return (
    <PageContainer>
      <h1>Sign in</h1>
      <p className="page-description">
        Authentication is not implemented yet. This page is a placeholder for the
        future login form.
      </p>
      <Button type="button" disabled>
        Log in
      </Button>
      <p className="auth-switch">
        Don&apos;t have an account? <Link to="/register">Register</Link>
      </p>
    </PageContainer>
  )
}
