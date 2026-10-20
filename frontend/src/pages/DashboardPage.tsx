import { useAuth } from '../features/auth/auth-context'
import { PageContainer } from '../components/ui/PageContainer'

export default function DashboardPage() {
  const { user } = useAuth()

  return (
    <PageContainer>
      <h1>Dashboard</h1>
      {user ? (
        <p className="page-description">
          Welcome back, {user.firstName} {user.lastName}.
        </p>
      ) : null}
      <p>
        Your financial overview will appear here. This is a placeholder until
        the dashboard is implemented.
      </p>
    </PageContainer>
  )
}
