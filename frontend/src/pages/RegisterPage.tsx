import { Link } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { PageContainer } from '../components/ui/PageContainer'

export default function RegisterPage() {
  return (
    <PageContainer>
      <h1>Create account</h1>
      <p className="page-description">
        Registration is not implemented yet. This page is a placeholder for the
        future sign-up form.
      </p>
      <Button type="button" disabled>
        Sign up
      </Button>
      <p className="auth-switch">
        Already have an account? <Link to="/login">Sign in</Link>
      </p>
    </PageContainer>
  )
}
